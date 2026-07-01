# SA Workflow 心智想法

## 一. 既有 Codebase 「規格」分析/撰寫 ( optional ) 
既有 Codebase 規格撰寫。  
optional 原因：可能原本就有規格，或不需要既有 Codebase。  

## 二. 既有 Codebase 「架構」分析 (optional)
繪製既有 Codebase  ClassDiagram 、SequenceDIagram。  
optional 原因：可能原本就有規格，或不需要既有 Codebase

## 三. (Human-in-loop) 確認規格/架構文件
Human-in-loop - 確認既有 Codebase ClassDiagram 、SequenceDiagarm 細節。  
optional 原因：
* 可能原本就有規格，或不需要既有 Codebase。
* 可選，可跳過 檢查與確認 的步驟。

## 四. 新舊規格差異比對 ( optional )
和新規格比較差異，產出差異文件。  
optional 原因：可能沒有既有 Codebase。  

## 五. ( Humain-in-loop ) 確認新舊規格差異正確性/細節 ( optional )
optional 原因：可選，可跳過 檢查與確認 的步驟。


## 六 撰寫 SA 文件
依照情境，選擇 六-A 或 六-B。

### 六-A. 有 codebase , 撰寫 SA 文件
撰寫 SA 文件 - 針對新舊規格差異與現有 codebase , 依照功能進行分類，拆解出每一個需要異動的組件/模組，並需要寫出每一個檔案位置與功能之間的依賴。( 有 codebase 的選項 )

### 六-B. 無 codebase , 撰寫 SA 文件
撰寫 SA 文件 - 根據新規格，依照功能進行分類，並標記每個功能之間的依賴。  ( 無 codebase 的選項 )

## 七. ( Human-in-loop ) - 確認 SA 文件正確性/細節。
必須由人來處理與決策.

## 產出 Design 文件
第八步驟 和 第九步驟是一個 loop，每次只 `針對某一個功能` 進行 Design (架構設計等), 設計完後產出。   
`產出 Design 文件` 嚴格遵循 `每次只針對某一個功能進行 進行 Design`，不平行處理。  

## 八. 產出 Design 文件
分別針對每個功能類型，參考既有 Codebase 設計，依照新規格設計架構，並繪製 ClassDiagram、SequenceDiagram，產出 Design 文件。

## 九. ( Human-in-loop ) 確認/檢查 Design ( optional )
確認設計架構。  
optional 原因：可選，可跳過 檢查與確認 的步驟。


## 十. 依照 Design 文件，產出 task
將 Design 文件  從底層開始拆解成 任務 task。