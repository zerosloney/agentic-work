# HTML & CSS 模板

> v21.2+ Grid 视图（TileView/CardView/WinExplorerView）HTML 模板渲染 + DrawHTML 降级方案。
> 本文件从 `advanced-features.md` §20 抽出（2026-08）。按需加载，标准流程不读。


> 适用版本：DevExpress v21.2+。需引用 `DevExpress.XtraGrid.v21.2.dll`。以下源码整理自官方文档 `docs.devexpress.com/WindowsForms/119961/` 和官方博客（evget.com v21.2 新特性）。

HTML/CSS 模板让 Grid 的 TileView、CardView、WinExplorerView 支持 Web 风格的卡片渲染，无需 CustomDraw 手动绘制。

### 20.1 TileView HTML 磁贴模板

TileView 支持 `TileHtmlTemplate`（单一模板）或 `TileHtmlTemplates` 集合（多模板 + `QueryItemTemplate` 事件切换）。

```csharp
// 1. 声明模板（HTML + CSS）
string tileHtmlTemplate = @"
<div class='tile'>
  <div class='title'>${Name}</div>
  <div class='subtitle'>${Category}</div>
  <div class='price'>¥${Price}</div>
  <div class='badge'>${Status}</div>
</div>";

// 2. 分配给 TileView
tileView1.TileHtmlTemplate = tileHtmlTemplate;

// 3. 可选：多模板时处理切换事件
tileView1.QueryItemTemplate += (sender, e) =>
{
    var data = tileView1.GetRow(e.RowHandle) as Product;
    if (data == null) return;
    e.TemplateId = data.IsFeatured ? "featured" : "normal";
};

// 4. 可选：响应 HTML 元素点击事件（交互元素）
tileView1.ElementMouseClick += (s, e) =>
{
    if (e.ElementId == "btnDetails")
        ShowProductDetail(e.RowHandle);
};
```

> CSS 示例（支持阴影、圆角等 Web 效果）：
> ```css
> .tile { width: 200px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); padding: 12px; }
> .title { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
> .price { color: #e74c3c; font-size: 16px; font-weight: bold; }
> .badge { background: #3498db; color: white; border-radius: 4px; padding: 2px 6px; font-size: 11px; }
> ```

### 20.2 CardView 命名占位符（替代索引占位符）

v21.2 新增：CardCaptionFormat 支持字段名替代列索引 `{0}`、`{1}`。

```csharp
// 旧写法（v21.1 及之前，按列索引引用）
cardView1.CardCaptionFormat = "Record # {0}, {1}";

// v21.2+ 新写法（用字段名，更稳定）
cardView1.CardCaptionFormat = "Record # {0}, {Name}";

// RecordHeaderFormat 同理
cardView1.RecordHeaderFormat = "{0} - {EmployeeName}";
```

### 20.3 WinExplorerView HTML 模板

WinExplorerView（文件浏览器视图）支持 `HtmlTemplates` 集合 + `QueryItemTemplate` 事件：

```csharp
// 每个视图样式（大图标/图块/详细信息）可单独设置模板
winExplorerView1.Style = WinExplorerViewStyle.Tile;
winExplorerView1.StyleOptions.HtmlTemplate = tileHtmlTemplate;  // 大图标模板
winExplorerView1.StyleOptions = WinExplorerViewStyleOptions.Large; // 切到大图标

// 动态模板
winExplorerView1.HtmlTemplates.Add(new HtmlTemplate { Id = "custom", Content = myTemplate });
winExplorerView1.QueryItemTemplate += (s, e) =>
{
    var item = winExplorerView1.GetRow(e.RowHandle) as MyItem;
    e.TemplateId = item.IsHighlighted ? "custom" : null;  // null = 使用默认
};
```

### 20.4 数据绑定语法

模板中引用数据字段用 `${FieldName}` 占位符（区分大小写）：

```html
<input class="input" name="emailEdit" value='${Email}'/>
<div class="text">${FullName} ({Ticker}) 涨跌 ${Direction} ${Percentage}%。当前价格 ${Price}.</div>
```

> 绑定枚举值：`${Direction}` 配合 `AlertControl.BeforeFormShow` 事件中 `e.HtmlPopup.DataContext = myDataObject`。

### 20.5 CustomDraw~/DrawHTML() 降级方案

并非所有控件都原生支持 HTML 模板，但所有 `CustomDraw~` 事件都带 `DrawHtml()` 方法：

```csharp
// 在 CustomDrawEmptyForeground 中绘制 HTML 背景（ListBox 等空状态）
private void listBox_CustomDrawEmptyForeground(object sender, CustomDrawEventArgs e)
{
    var htmlTemplate = new HtmlTemplate(myHtml, myCss);
    var ctx = new DxHtmlPainterContext();
    e.DrawHtml(htmlTemplate, ctx);
}

// 处理鼠标悬停/点击（需额外绑定 MouseMove/MouseDown）
listBox.MouseMove += (s, e) =>
{
    if (listBox.ItemCount == 0)
    {
        ctx.OnMouseMove(e);
        listBox.Cursor = ctx.GetCursor(e.Location);
        listBox.Invalidate();
    }
};
```

### 20.6 已知限制（官方明确）

- **不要**创建超过 2 层嵌套的 flex 布局（性能问题）
- **不要**使用 CSS 动画（不支持）
- **不要**在 HTML 元素上直接修改逻辑 → 改用 `ElementId` + 事件处理
- **不要**直接拿外部 HTML/CSS 来用（可能包含不支持的标签/属性）
- **不要**在 `CustomDraw~` 事件中修改 HTML 元素结构

