# Cassiniが燃え尽きた後も土星を計算し続けるFortranコードの話

## はじめに

GitHubの片隅に「惑星」のコードを見つけた。

**Saturn Magnetospheric Model**。NASA/ESAの土星探査機Cassiniが13年間かけて収集した磁場データから構築された、土星の磁気圏モデルだ。Fortran 77で実装されている。2,334行、20ファイル。

2017年9月15日、Cassiniは土星の大気に突入して燃え尽きた。「Grand Finale」と名付けられたミッション最後の22周回で、土星の環の内側を通過し、かつてない精度で磁場を計測した。そのデータはDougherty et al. (2018)の論文として発表され、G.K. StephensがJohns Hopkins大学応用物理学研究所(APL)でFortranコードに実装した。

探査機は消えた。しかしFortranのサブルーチンの中で、Cassiniが測った磁場は今も計算され続けている。

---

## Fortranという言語

Fortran。1957年、IBMのJohn Backusが開発した**世界最初の高級プログラミング言語**。名前は「FORmula TRANslation（数式変換）」の略。67年経った今も、気象予報、流体力学、量子化学、天体物理——あらゆる科学技術計算の現場で使われ続けている。

COBOLが「ビジネスの言語」なら、Fortranは「科学の言語」だ。

このモデルが使うのはFortran 77——1977年の規格。カラム1-6は特殊領域、**C**でコメント、6カラム目の文字で継続行。自由形式のFortran 90以降とは別世界だ。

```fortran
C==========================================================================
C     May 2019, G.K.Stephens, this subroutine was adabpted to the Saturn
C     magnetic field model.
C
      SUBROUTINE tailsheet_sym (n,rho0,D0,AJM,
     .     x,y,z,
     .     bx,by,bz)

      IMPLICIT NONE
```
— **src/tailsheet_sym.f:1-9**

「adabpted」——adaptedのタイプミス。科学者が書くコードには、こういう小さな人間の痕跡が残る。

---

## 発掘された痕跡

### 痕跡1：3人の科学者の署名——20年間のリレー

このコードには、3人の科学者の名前が刻まれている。

```fortran
C     AUTHOR: N. A. TSYGANENKO
C     LAST MODIFICATION:  MARCH 21, 2008 (DOUBLE-PRECISION VERSION)
```
— **src/igrf_geo_08.f:22-23**

**Nikolai Tsyganenko**——ロシア出身、地球磁気圏モデリングの世界的権威。彼のGEOPACK-2008ライブラリは、地球の内部磁場（IGRF）を球面調和関数で計算する。2008年3月21日の改版。

```fortran
c     The implementation is based on K.Khurana's KMAG model.
```
— **src/bowldeform.f:4**

**Krishan Khurana**——UCLAの惑星科学者。木星・土星の磁気圏モデル（KMAG）を開発。Bowl変形アルゴリズムの原型を実装。

```fortran
C     May 2019, G.K.Stephens, this subroutine was adabpted to the Saturn
C     magnetic field model.
C
C     July 2017, G.K.Stephens, this routine updated to incorporate Jay Albert's
C     improvements to the Bessel function evaluation.
```
— **src/tailsheet_sym.f:2-6**

**G.K. Stephens**——Johns Hopkins APLの研究者。Tsyganenkoの地球モデルをベースに、KhuranaのKMAGを参考にしつつ、Cassiniの土星データに適用した。Jay Albertとの共同改善も記録されている。

Tsyganenko（2008年）→ Khurana → Stephens（2017年、2019年）。20年間、3人の科学者がリレーのようにコードを受け継いだ。

### 痕跡2：Cassiniの遺産——論文の係数がそのままコードに

```fortran
c     Computes the internal magnetic field for Saturn in the KSM
c     coordinate system in units of nT. The coefficients are from
c     Dougherty et al. (2018) (https://doi.org/10.1126/science.aat5434).
...
      DATA GS/0.0D0, 21140.2D0,   0.0D0, 1581.1D0,   0.0D0,
```
— **src/saturn_int.f:6-16**

Dougherty et al. (2018)——Science誌に掲載された論文。Cassiniの Grand Finale 軌道で測定された磁場データから、土星の内部磁場係数を導出した。

**21140.2** nT——土星の主双極子磁場係数。この数値は、Cassiniが土星の環の内側を22回通過して計測したデータから逆解析で求められた。探査機が燃え尽きた後も、この数値はFortranの**DATA**文の中で生き続けている。

### 痕跡3：Miller逆方向再帰——Numerical Recipesの知恵

Bessel関数の計算に、数値計算の古典的テクニックが使われている。

```fortran
      SUBROUTINE bessJJ(n,x, bessJ)
      IMPLICIT REAL*8 (A-H,O-Z)
      PARAMETER (IACC=40,BIGNO=1.D10,BIGNI=1.D-10)
...
c     use Miller's algorithm for Bessel functions which uses the identity:
c     1.0 = 2.0*sum(J_evens) - J0, thus the quantity (2.0*sum(J_evens) - J0)
c     is used as a normalization factor
      bnorm=2.D0*evnsum-bj
```
— **src/bessjj.f:1-55**

Miller逆方向再帰法。高次のBessel関数から低次に再帰的に降りてくる。途中でオーバーフローしないよう**BIGNO**（10^10）と**BIGNI**（10^-10）でスケーリングし、最後に正規化する。

Numerical Recipes（数値計算のバイブル）の**bessj**関数からの引用実装だ。1986年初版のこの本は、Fortranプログラマーにとって聖典だった。2019年のコードに、1986年のアルゴリズムが生きている。

### 痕跡4：余因子行列——∇·B = 0 を守る数学的誠実さ

Bowl変形（磁気圏のお椀型変形）で座標変換を行う際、**ヤコビアンではなく余因子行列**を使っている。

```fortran
c     Now calculate the T matrix
      Txx = dypdy*dzpdz-dypdz*dzpdy
      Txy = dxpdz*dzpdy-dxpdy*dzpdz
      Txz = dxpdy*dypdz-dxpdz*dypdy
      Tyx = dypdz*dzpdx-dypdx*dzpdz
      Tyy = dxpdx*dzpdz-dxpdz*dzpdx
      Tyz = dxpdz*dypdx-dxpdx*dypdz
      Tzx = dypdx*dzpdy-dypdy*dzpdx
      Tzy = dxpdy*dzpdx-dxpdx*dzpdy
      Tzz = dxpdx*dypdy-dxpdy*dypdx

c     Now calculate the field at the mapped location
      Bxmap = Txx*Bx+Txy*By+Txz*Bz
```
— **src/bowldeform.f:100-136**

なぜヤコビアンではなく余因子行列か？ 磁場は∇·B = 0（発散ゼロ）でなければならない。一般のヤコビアン変換ではこの性質が壊れる。余因子行列変換は発散ゼロを保存する——物理法則を数値計算の中で破らないための、数学的誠実さだ。

9つの偏微分を数値微分（dr = 0.01）で計算し、3×3の完全な余因子行列を構築する。コードは35行。この35行が、物理法則の無矛盾性を保証している。

### 痕跡5：3つの座標系の迷宮

このコードでは3つの座標系が使われる。

```fortran
c     KSM  — Kronocentric Solar Magnetospheric（太陽方向がX軸）
c     KSMAG — Kronocentric Solar Magnetic（磁気軸に回転）
c     KSO  — Kronocentric Solar Orbital（太陽位置の計算）
```

```fortran
C     Rotate from KSM to KSMAG frame
      CALL rotate_about_y(sunLat, x, y, z, xk, yk, zk)
```
— **src/saturn_ext.f**

ダイポール遮蔽場はスケーリングされたKSM座標で計算し、テール電流はBowl変形されたKSMAG座標で計算する。太陽の位置は**ksun**サブルーチンでKSO座標から求める。

この座標系の使い分けがコード中にコメントされていない。どの計算がどの座標系で行われるかは、**論文を読まなければわからない**。変換時に最も苦労した部分であり、科学計算コードの「暗黙知」の典型だ。

### 痕跡6：ksun——2004年の太陽位置計算

太陽の位置を計算するサブルーチンに、最も古い日付が残っている。

```fortran
      Subroutine KSun(time,stheta,sphi,Ztheta,Zphi)
c     INPUT:  J2000 time of the data point
C     OUTPUTS: stheta, sphi, latitude and longitude (in radians) of the Sun in system III (RH).
c
c     Last updated August 26, 2004.
```
— **src/ksun.f:1-6**

2004年8月26日——Cassiniが土星軌道に投入された年だ。Cassiniは2004年7月1日に土星に到着した。その2ヶ月後に書かれたこのサブルーチンは、土星から見た太陽の位置を計算する。

J2000エポック基準の時間計算。土星の自転周期（10.65622222時間）と公転周期（10,759.22日 ≈ 29.46年）が定数として埋め込まれている。Cassiniが13年間測定を続けている間、このサブルーチンは太陽がどこにあるかを計算し続けた。

### 痕跡7：5年間のバージョン進化——プロトタイプからNASA公開版へ

```
----- Version 0.0, 2019/06/10
- This is the initial prototype release to be distributed to the Cassini MIMI team.

----- Version 1.0, 2023/04/28
- This is the initial release on the NASA-Planetary-Science GitHub repository.
- The source code is functionally equivalent to the prototype release, but some
  subroutines have been changed and renamed to remove dependencies on 3rd party codes.

----- Version 1.0.2, 2024/03/18
- New capabilites were added to evaluate the minimum (shortest) distance
  between a point and the Bowl current sheet.
```
— **CHANGELOG.txt**

2019年6月、Cassini MIMIチーム向けプロトタイプ。2023年4月、NASA Planetary Science GitHubで一般公開。第三者コード依存性（NAIF-SPICEライセンス問題）を除去。2024年3月、最新改善。

科学コードの典型的なライフサイクルだ。まず研究チーム内で共有され、論文が出版されてから一般公開される。5年の時差がある。

---

## 推定される経緯

**1957年**: John BackusがFortranを開発。科学計算の標準言語になる。

**2004年7月1日**: Cassiniが土星軌道に投入。13年間のミッション開始。**ksun**サブルーチンが書かれる。

**2008年3月21日**: TsyganenkoがGEOPACK-2008を改版。地球磁場モデルの最新版。

**2017年7月**: G.K. StephensがJay Albertとの共同でBessel関数評価を改善。

**2017年9月15日**: Cassini Grand Finale。土星大気に突入して消滅。

**2018年**: Dougherty et al.がScience誌に論文発表。Cassiniの磁場データから土星内部磁場係数を導出。

**2019年5月**: StephensがTsyganenkoの地球モデルを土星に適用。全サブルーチンを「adabpted」。

**2019年6月10日**: Cassini MIMIチーム向けプロトタイプ配布。

**2023年4月28日**: NASA Planetary Science GitHubで一般公開。

---

## AI 解析データ

### コードの特徴
| 指標 | 値 |
|:---|---:|
| Fortranファイル | 20個 (.f) |
| コード行数 | 2,334行 |
| 座標系 | 3種類 (KSM, KSMAG, KSO) |
| 球面調和係数 | 105個 (GS配列) |
| Bessel関数次数 | 最大n=6 |
| 余因子行列 | 3×3 (9偏微分) |
| ディポール遮蔽係数 | 50個 (5×5×2行列) |
| 開発者署名 | 3人 (Tsyganenko, Khurana, Stephens) |

---

## 鑑定結果

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コード鑑定書 No.018
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【鑑定対象】Saturn Magnetospheric Model (2004〜2024, Fortran 77)
【鑑定人】GState Inc. / AI + Human
【鑑定日】2026年3月

■ 鑑定結果
  希少度:          ★★★★★
  技術的負債密度:    ★★☆☆☆
  考古学的価値:     ★★★★★
  読み物としての面白さ: ★★★★☆
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 希少度: ★★★★★
NASAの惑星探査ミッションのデータ解析コードがGitHubで公開されている例は極めて稀。Cassiniが13年間かけて収集した磁場データの「計算機」がFortran 77のソースコードとして読める。

### 技術的負債密度: ★★☆☆☆
科学者が書いたコードは無駄が少ない。2,334行に一切の肥大化がない。ただし座標系の使い分けが文書化されていない暗黙知、タイプミス（adabpted）、コメント不足は存在する。

### 考古学的価値: ★★★★★
3人の科学者（Tsyganenko, Khurana, Stephens）の20年間のリレー。Numerical Recipesのアルゴリズム。Cassiniミッション（2004-2017）のデータ。Fortran 77の1977年規格。科学計算の歴史が複数の層で積み重なっている。

### 読み物としての面白さ: ★★★★☆
コードの行間に微分方程式が透けて見える。変数名は論文の記法そのまま（**rho**, **kn**, **zDist**）。理解するにはコードだけでなく背後の物理学を理解する必要がある——敷居は高いが、その分だけ深い。

---

## 鑑定人所見

このコードは「探査機の墓碑銘」だ。

2017年9月15日、Cassiniは土星の大気に突入して燃え尽きた。20年間の航海、13年間の観測、45万枚以上の画像。すべてが土星の雲の中で消えた。

しかしCassiniが測った磁場データは、Fortranの**DATA**文の中で生き続けている。**21140.2** nT——土星の主双極子磁場係数。この数値は、Grand Finaleの22周回で測定されたデータから導出された。探査機が最後に送ったデータの結晶だ。

3人の科学者がリレーのようにコードを受け継いだ。Tsyganenko（2008年、地球モデル）→ Khurana（木星・土星モデル）→ Stephens（2019年、Cassiniデータ適用）。科学の営みは個人を超える。コードもまた、著者を超えて受け継がれる。

余因子行列で∇·B = 0を保存する35行のコード。Miller逆方向再帰でBessel関数を安定に計算する50行のコード。科学者が書くコードには「正しさ」への執着がある。ビジネスアプリケーションの「動けばいい」とは違う次元の品質基準——物理法則を破らないこと。

Cassiniは消えた。しかしFortranのサブルーチンの中で、土星の磁場は今も計算され続けている。

---

*本記事は Legacy Code Archive プロジェクトの一環として執筆されました。*
*コード鑑定書シリーズでは、世界中の「消えゆく古いコード」を発掘・分析し、その中に残された開発者たちの声を伝えます。*
