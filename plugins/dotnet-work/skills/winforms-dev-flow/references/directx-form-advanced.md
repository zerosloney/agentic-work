# DirectX Form

> v22.1+ DirectX 硬件加速表单 + HTML 标题栏模板 + 与标准 XtraForm 区别。
> 本文件从 `advanced-features.md` §23 抽出（2026-08）。按需加载，标准流程不读。


> 适用版本：DevExpress v22.1+。需要 `DevExpress.XtraEditors.v22.1.dll` 及以上。

DirectX Form 为所有子控件启用 DirectX 硬件加速，并支持在表单框架上应用 HTML/CSS 模板。官方博客（evget.com v22.1 新特性）：

### 23.1 启用 DirectX 渲染

```csharp
// 方式一：项目全局设置（Program.cs）
DevExpress.XtraEditors.WindowsFormsSettings.ForceDirectXPaint = DefaultBoolean.True;

// 方式二：单个 Form 继承 DirectXForm（v22.1+）
public partial class MyDirectXForm : DevExpress.XtraEditors.DirectXForm
{
    // 所有子控件自动启用 DirectX 渲染
}

// 方式三：Fluent Design Form（自带 DirectX + Acrylic 效果）
public partial class MyFluentForm : DevExpress.XtraEditors.FluentDesignForm
{
    // 侧边半透明亚克力效果 + DirectX
}
```

### 23.2 DirectX Form HTML 模板

DirectX Form 接受 HTML 模板来自定义标题栏和框架：

```csharp
// 默认模板结构（标准窗口元素，无需 CSS 即可工作）
string defaultTemplate = @"
<dx-form-frame id='frame'>
  <dx-form-titlebar id='titlebar'>
    <dx-form-icon id='icon'></dx-form-icon>
    <dx-form-text id='text'></dx-form-text>
    <dx-form-minimizebutton id='minimizebutton'></dx-form-minimizebutton>
    <dx-form-maximizebutton id='maximizebutton'></dx-form-maximizebutton>
    <dx-form-closebutton id='closebutton'></dx-form-closebutton>
  </dx-form-titlebar>
  <dx-form-content id='content'></dx-form-content>
</dx-form-frame>";

// 最小自定义模板（无标准按钮样式）
string minimalTemplate = @"
<div id='frame' class='frame'>
  <div id='content'></div>
</div>
<style>.frame { height: 100%; }</style>";

// 最简有效模板（必须有 frame 和 content 元素 ID）
string bareMinTemplate = @"
<div id='frame' class='frame'>
  <div id='content'></div>
</div>
<style>.frame { height: 100%; background: #f5f5f5; }</style>";

// 赋值
this.HtmlTemplate = bareMinTemplate;
```

### 23.3 DirectX Form vs 标准 XtraForm

| 特性 | XtraForm | DirectXForm |
|------|---------|-------------|
| DirectX 渲染 | 需要全局开关 | 表单级启用 |
| Ribbon/Gallery DirectX | 不支持 | 支持 |
| HTML 标题栏模板 | 不支持 | 支持 |
| 调整大小动画 | 标准 | 流畅动画 |
| SimpleButton DirectX | 不支持 | 支持（表单内） |

### 23.4 已知不支持的控件

以下控件放在 DirectX Form 上**不会**使用 DirectX 渲染（即使放在支持 DirectX 的表单上）：电子表格（SpreadsheetControl）等。放置后它们会以标准 GDI+ 渲染。
