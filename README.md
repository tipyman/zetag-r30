ーーーーーーーーーーーーーーーーーーーーーーーーーーー
詳細仕様（ZETag R3.0 MakeCode拡張）
概要
micro:bitからZETag MSTG-ST30をUARTで制御し、周波数・チャンネル・出力設定やデータ送信を行う拡張です。
R2.2からの変更点は、4FSK/8FSKのモード選択機能を追加しました。

拡張の追加方法（MakeCode）
・ MakeCode for micro:bit を開く
・ 歯車メニュー → Extensions
・ 検索欄に GitHub リポジトリ URL を貼り付け
    https://github.com/tipyman/zetag-r30
または「Import URL」でも同URLを指定可能です（承認リスト外でもURL指定で読み込みできます）。

追加が完了すると、ツールボックスに ZETag-R30 カテゴリが現れます。

ーーーーーーーーーーーーーーーーーーーーーーーーーーー
ハードウェア構成（必読）
・ UART（115,200bps）
    ・ micro:bit P1(TX) → ZETA RX
    ・ micro:bit P0(RX) → ZETA TX
    ・ UARTをピンで使うため、serial.redirect(P1, P0, 115200) を最初に実行してください。
・ Wakeup 制御: P2（アクティブ"H"）
    ・ 起動時に High (30msec待ち）ウェイク、処理が終了したらLowにします
・ 占有ピン: P0 / P1 / P2 （他機能と混在不可）

TX/RXはクロス接続です。ボーレートは 115,200bps を使用（MakeCode側の選択肢にあります）。

ーーーーーーーーーーーーーーーーーーーーーーーーーーー
周波数テーブル（ZETag MSTG-ST30）

| 周波数番号 | 中心周波数 [MHz] |
|-----------|------------------|
| 0         | 920.6           |
| 1         | 920.8           |
| 2         | 921.0           |
| ...       | ...             |
| 18        | 924.2           |
| 19        | 924.4           |
| ...       | ...             |
| 37        | 928.0           |

**範囲**: 920.6MHz〜928.0MHz  
**刻み幅**: 200kHz  
**チャネル数**: 38

範囲: 920.6MHz〜928.0MHz
刻み幅: 200kHz
チャネル数: 38

ーーーーーーーーーーーーーーーーーーーーーーーーーーー
ブロック／API一覧（namespace ZETag_R30）
 主な機能と戻り値を要約します。

データ送信
    // ZETagコマンド列を転送　（チェックサムコードも含めて下さい）
    // モジュールからのクエリデータを返します
    export function Send_ZETag_co(mand(txArray: number[]): number[]
    
    // ZETagデータを転送　　送信データのみを設定
    export function Transmit_ZETag_data(txArray: number[]): void 

ZETag初期化
    // ZETagの使用周波数、チャンネル数、チャンネル間隔、出力パワー、送信モードを設定
    export function applySetting(
        frequency: number,
        chSpace: ChSpace,
        chNum: ChNum,
        txPower: TxPower,
        mode: Mode
    ): void 

その他　ZETagのパラメータ個別に初期化
    // ZETagの出力パワーを設定
    export function Set_TX_Power(txPower: number): void 

    // ZETagのチャンネル間隔を設定
    export function Set_channel_spacing(chSpace: number): void

    // ZETagの使用周波数、チャンネル数、チャンネルステップを設定
    export function Set_Frequency(frequency: number, chNum: number, chStep: number): void

ーーーーーーーーーーーーーーーーーーーーーーーーーーー
TypeScriptサンプル（Wakeup="H"アクティブ対応）
    TypeScriptserial.redirect(SerialPin.P1, SerialPin.P0, BaudRate.BaudRate115200);
    // Wakeup: Lアクティブ → Lowで起動
    pins.digitalWritePin(DigitalPin.P2, 0);
    basic.pause(10);
    pins.digitalWritePin(DigitalPin.P2, 1);
    
    // 周波数番号指定で設定
    ZETag_R30.Set_Frequency_By_Index(10);    // 922.6MHz
    ZETag_R30.Set_TX_Power(8);
    ZETag_R30.Set_channel_spacing(200);
    ZETag_R30.Set_TX_Mode(0);
    
    // データ送信
    input.onButtonPressed(Button.A, function () {
        ZETag_R30.Transmit_ZETag_data([0x01, 0x02, 0xA5, 0x5A]);
    });

ーーーーーーーーーーーーーーーーーーーーーーーーーーー
注意事項
・ WakeupはLアクティブ（Lowで起動）
・ UARTは115,200bpsに設定
・ P0/P1/P2占有（他機能との併用不可）
・ TX/RXクロス接続
・ 電波法に適合する周波数を使用

ーーーーーーーーーーーーーーーーーーーーーーーーーーー
ライセンス / リンク
・ 公開ページ: https://tipyman.github.io/zetag-r30/
・ GitHubリポジトリ: https://github.com/tipyman/zetag-r30
・ ライセンス: MIT推奨


> このページを開く [https://tipyman.github.io/zetag-r30/](https://tipyman.github.io/zetag-r30/)

## 拡張機能として使用

このリポジトリは、MakeCode で **拡張機能** として追加できます。

* [https://makecode.microbit.org/](https://makecode.microbit.org/) を開く
* **新しいプロジェクト** をクリックしてください
* ギアボタンメニューの中にある **拡張機能** をクリックしてください
* **https://github.com/tipyman/zetag-r30** を検索してインポートします。

## このプロジェクトを編集します

MakeCode でこのリポジトリを編集します。

* [https://makecode.microbit.org/](https://makecode.microbit.org/) を開く
* **読み込む** をクリックし、 **URLから読み込む...** をクリックしてください
* **https://github.com/tipyman/zetag-r30** を貼り付けてインポートをクリックしてください

#### メタデータ (検索、レンダリングに使用)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
