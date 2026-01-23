/**
 * makecode ZETag module Package Release 3.0
 * Written by Masakazu Urade (Tipyman)　2026/1/21
 */

/**
 * ZETag block Ver3.0
 */

//% weight=100 color=#32CD32 icon="\uf482" block="ZETag R3.0"
namespace ZETag_R30 {
    const txBuffer = pins.createBuffer(1);

    /**
     * Binary data transmission over UART
     * @param TX_data: 8bit data
    */
    function UART_BIN_TX(txData: number): void {
        txBuffer.setUint8(0, txData);
        serial.writeBuffer(txBuffer)
    }

    /**
     * Binary data reception over UART
     * @param value: none
     * @return value: 16bit data If return value is 256, reception time out.
    */
    function UART_BIN_RX(): number {
        const rxBuffer = serial.readBuffer(1)   // Bloking function (wait till receipt)
        if (rxBuffer.length > 0) {              // When receive data, alway length > 0
            return rxBuffer[0]
        }
        return 0;                               // Never come to this line.
    }

    function receive_query(): number[] {
        let response = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        let timeoutCounter = 0

        while (true) {
            const data = UART_BIN_RX();
            if (data == 0xff) break;
            timeoutCounter++;
            if (timeoutCounter > 15) return response; // Timeout
        }

        if (UART_BIN_RX() == 0) {   // FF 00 を待つ
            response[0] = 0xff;
            response[1] = 0x0;
            let length = UART_BIN_RX();
            if (length > 6) length = 6;
            response[2] = length;
            let sum = 0xff + 0x00 + length
            for (let i = 0; i < length - 1; i++) {
                const d = UART_BIN_RX() & 0xff;
                response[3 + i] = d;
                sum += d;
            }
            const crc = UART_BIN_RX() & 0xFF;
            response[length + 2] = crc;   // Store CRC data to response
            response = response.slice(0, length + 2); //omit redandant data
            if ((sum & 0xff) != crc) {
                response = [3]
            }
        }
        else response = [1];
        if (response[3] == 0xff) {
            response = [2]
        }
        return response
    }

    /**
     * Send ZETag command execution
     * @param txArray : number[]
     * @param querySize: number
     * @return queryData[]
        queryData[0]:
                0xff    Query data is ready,
                   1    Time out error,
                   2    Size error (Query size <> Receipt size),
                   3    ZeTag error,
                   4    Checksum error,
                   5    Query data error
       */
    //% blockId=Send_ZETag_command block="Send ZETag command %txArray"
    //% group="Send data" weight=95 blockGap=8
    export function Send_ZETag_command(txArray: number[]): number[] {
        const txArraySize = txArray.length
        for (let l = 0; l < txArraySize; l++) {
            UART_BIN_TX(txArray[l])
        }
        let queryData = receive_query()
        if ((queryData[3] == 0xf1) && (txArray[3] == 0xf0)) {
            return queryData
        } else if (queryData[3] != txArray[3]) {
            queryData[0] = 4
        }
        if (queryData[3] != txArray[3]) {
            if ((queryData[3] != 0xf1) || (txArray[3] != 0xf0)) {
                queryData[0] = 4
            }
        }
        return queryData
    }

    /**
     * send zetag application data
     */
    //% blockId=Transmit_ZETag_data block="Transmit ZETag data %dataArray"
    //% group="Send data" weight=95 blockGap=8
    export function Transmit_ZETag_data(txArray: number[]): void {
        // 0xff+2+0x80=0x181 -> 0x81
        // Query FF 00 02 80 81
        let num = txArray.length
        if (num < 1) return;
        if (num > 30) num = 30;
        // 0xff+2+0x80=0x181 -> 0x81  FF 00 02 80 xx xx xx
        let checkSum = 0x81 + num
        for (let m = 0; m < num; m++) {
            checkSum += txArray[m]
        }
        checkSum %= 256;
        const header = [0xff, 0x00, num + 2, 0x80];
        const response2 = Send_ZETag_command(header.concat(txArray).concat([checkSum]));
    }

    // --- 既存ロジック（そのまま利用） ---

    /**
     * get Protocol Version
    */
    //% blockId=Get_Protocol_Version block="Get Protocol Version"
    //% subcategory="Other"
    //% weight=95 blockGap=8
    export function Get_Protocol_Version (): number {
        // FF 00 02 02 03 /* バージョンの取得 */ 
        // Query FF 00 04 02 01 04 0A とか　FF 00 04 02 01 00 06
        // メインバージョン(4バイト目）、サブバージョン（5バイト目）で回答
        //　この関数からは上位4ビットがメイン、下位4ビットがサブバージョンを示す

        const response = Send_ZETag_command([0xff, 0x00, 0x02, 0x02, 0x03])
        return (((response[4] & 0xf) << 4) + (response[5] & 0xf)) & 0xff;
    }

    /**
     * set tx power
    */
    //% blockId=Set_Operating_Mode block="Set Operating Mode %mode"
    //% subcategory="Other"
    //% weight=95 blockGap=8
    //% mode.min=0 mode.max=1 mode.defl=0
    export function Set_Operating_Mode(mode: OP_Mode): void {
        // FF 00 03 44 00 46 ; normal mode (mode = 0)
        // FF 00 05 44 01 00 01 4A ; test mode (mode = 1)
        // Query FF 00 02 44 45

        if (mode === OP_Mode.Test) {
            const response = Send_ZETag_command([0xff, 0x00, 0x05, 0x44, 0x01, 0x00, 0x01, 0x4a])
        } else {
            const response = Send_ZETag_command([0xff, 0x00, 0x03, 0x44, 0x00, 0x46])
            mode = OP_Mode.Normal
        }
    }
      
    /**
     * set tx power
     */
    //% blockId=Set_TX_Power block="Set TX Power %txPower (dB)"
    //% subcategory="Other"
    //% weight=95 blockGap=8
    //% txPower.min=1 txPower.max=10 txPower.defl=10
    export function Set_TX_Power(txPower: number): void {
        if (txPower == 0) txPower = 1;
        else if (txPower >= 10) txPower = 10;

        let txPowerData = txPower * 2
        // FF 00 03 41 10 53; 出力8dB設定
        // FF+00+03+41=0x143 -> 0x43
        // Query FF 00 02 41 42
        const response4 = Send_ZETag_command([0xff, 0x00, 0x03, 0x41, txPowerData, (0x43 + txPowerData) % 256])
    }

    /**
     * set channel spacing
     */
    //% blockId=Set_channel_spacing block="Set channel spacing %chSpace (kHz)"
    //% subcategory="Other"
    //% weight=95 blockGap=8
    //% chSpace.min=100 chSpace.max=200 chSpace.defl=100
    export function Set_channel_spacing(chSpace: number): void {
        // FF 00 03 F0 64 56; 100KHz設定
        // FF+00+03+F0=1F2 -> 0xf2
        // Query FF 00 02 F1 F2
        if (chSpace <= 100) {
            chSpace = 100
        } else if (chSpace >= 200) {
            chSpace = 200
        }
        const response3 = Send_ZETag_command([0xff, 0x00, 0x03, 0xf0, chSpace, (0xf2 + chSpace) % 256]);
    }

    /**
     * set transmission frequency
     */
    //% blockId=Set_Frequency block="Set Frequency %frequency (Hz) %chNum (ch) %chStep"
    //% subcategory="Other"
    //% weight=95 blockGap=8
    //% frequency.min=470000000 frequency.max=928000000 frequency.defl=922080000
    //% chNum.min=1 chNum.max=6 chNum.defl=2
    //% chStep.min=1 chStep.max=2 chStep.defl=2
    export function Set_Frequency(frequency: number, chNum: number, chStep: number): void {
        // Query FF 00 02 40 41
        if (chNum <= 1) chNum = -1;
        else if (chNum >= 6) chNum = 6;

        if (chStep == 0) chStep = 1;
        else if (chStep >= 2) chStep = 2;

        if (frequency < 470000000) frequency = 470000000;
        else if (frequency > 928000000) frequency = 928000000;
        else if ((frequency > 510000000) && (frequency < 920600000)) frequency = 510000000;

        let txArray = [
            0xff, 0x00, 0x08 + chNum, 0x40, 0x01,
            (frequency >> 24) & 0xff,
            (frequency >> 16) & 0xff,
            (frequency >> 8) & 0xff,
            frequency & 0xff,
            chNum, 0, 0, 0, 0, 0, 0, 0
        ]
        if (chNum >= 2) {
            for (let n = 0; n < chNum; n++) {
                txArray[10 + n] = n * chStep
            }
        } else {
            txArray[4] = 0
        }
        let checkSum2 = 0
        for (let o = 0; o < chNum + 10; o++) {
            checkSum2 += txArray[o]
        }
        checkSum2 %= 256
        txArray[10 + chNum] = checkSum2

        txArray = txArray.slice(0, 11 + chNum); // omit redundant data

        const response5 = Send_ZETag_command(txArray)
    }

    /**
     * set tx mode
     */
    //% blockId=Set_TX_Mode block="Set TX Mode %txMode"
    //% subcategory="Other"
    //% weight=95 blockGap=8
    //% txMode.defl=Mode.FSK4
    export function Set_TX_Mode(txMode: Mode): void {
        // FF 00 03 42 01 45; 4FSK mode
        // FF 00 03 42 10 54; 8FSK mode
        // Query FF 00 02 42 43
        if (txMode === Mode.FSK4) {   // 4FSK
            const response6 = Send_ZETag_command([0xff, 0x00, 0x03, 0x42, 0x01, 0x45])
        } else {                    // 8FSK
            const response6 = Send_ZETag_command([0xff, 0x00, 0x03, 0x42, 0x10, 0x54])
        }
    }

    // --- UI 用の enum（ドロップダウン生成） ---
    export enum ChSpace {
        //% block="100"
        KHz100 = 100,
        //% block="200"
        KHz200 = 200
    }
    export enum ChNum {
        //% block="1"
        _1 = 1,
        //% block="2"
        _2 = 2,
        //% block="3"
        _3 = 3,
        //% block="4"
        _4 = 4,
        //% block="5"
        _5 = 5,
        //% block="6"
        _6 = 6,
    }
    export enum TxPower {
        //% block="2"
        dBm2 = 2,
        //% block="4"
        dBm4 = 4,
        //% block="6"
        dBm6 = 6,
        //% block="8"
        dBm8 = 8,
        //% block="10"
        dBm10 = 10,
    }
    export enum Mode {
        //% block="4FSK"
        FSK4 = 0,
        //% block="8FSK"
        FSK8 = 1
    }

    export enum OP_Mode {
        //% block="Normal"
        Normal = 0,
        //% block="Test"
        Test = 1
    }

    // --- 5項目をまとめた設定ブロック（完成版） ---
    /**
     * ZETag の無線設定（周波数・帯域幅・チャンネル数・出力・送信モード）をまとめて適用
     */
    //% blockId=zetag_setting
    //% block="ZETag Setting|Frequency(Hz) %frequency|Band width(kHz) %chSpace|Number of Channel(ch) %chNum|Tx Power(dB) %txPower|Mode %mode"
    //% group="ZETag Setting" weight=95 blockGap=8
    //% frequency.min=470000000 frequency.max=928000000 frequency.defl=922080000
    //% chSpace.defl=ChSpace.KHz200
    //% chNum.defl=ChNum._2
    //% txPower.defl=TxPower.dBm8
    //% mode.defl=Mode.FSK4
    export function applySetting(
        frequency: number,
        chSpace: ChSpace,
        chNum: ChNum,
        txPower: TxPower,
        mode: Mode
    ): void {
        // 0) 変調方式の設定
        Set_TX_Mode(mode)

        // 1) 帯域幅の設定 いずれの設定でも100KHzにする
        Set_channel_spacing(ChSpace.KHz100)

        // 2) Tx 出力の設定
        Set_TX_Power(txPower)

        // 3) 周波数＋チャンネルの設定（Band width に応じて chStep を自動決定）
        const chStep = (chSpace === ChSpace.KHz200) ? 2 : 1
        Set_Frequency(frequency, chNum, chStep)
    }
}
