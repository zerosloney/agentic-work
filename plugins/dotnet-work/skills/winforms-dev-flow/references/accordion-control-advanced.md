# Accordion Control 手风琴导航

> 垂直折叠导航面板，多级嵌套 + 图标 + HTML 模板 + 与 NavBarControl 区别。
> 本文件从 `advanced-features.md` §22 抽出（2026-08）。按需加载，标准流程不读。


> 程序集：`DevExpress.XtraBars.v21.2.dll`，命名空间：`DevExpress.XtraBars`。

AccordionControl 是垂直折叠面板，适合做左侧导航菜单，支持多级嵌套、图标、HTML 模板。官方文档：`docs.devexpress.com/WindowsForms/116002/`。

### 22.1 基本结构

```csharp
// 在 Form 上放 AccordionControl
accordionControl1.Dock = DockStyle.Left;
accordionControl1.Width = 250;

// 根级别组
AccordionControlElement groupMain = new AccordionControlElement();
groupMain.Text = "主导航";
groupMain.Expanded = true;
accordionControl1.Elements.Add(groupMain);

// 子元素
AccordionControlElement item1 = new AccordionControlElement();
item1.Text = "首页";
item1.Style = ElementStyle.Item;  // Item = 可点击行
item1.Name = "nav_home";
groupMain.Elements.Add(item1);

AccordionControlElement item2 = new AccordionControlElement();
item2.Text = "数据管理";
item2.Style = ElementStyle.Group;  // Group = 可折叠组
groupMain.Elements.Add(item2);

// 嵌套子项
AccordionControlElement subItem = new AccordionControlElement();
subItem.Text = "用户列表";
subItem.Name = "nav_user_list";
item2.Elements.Add(subItem);
```

### 22.2 点击事件

```csharp
accordionControl1.ElementClick += (s, e) =>
{
    var element = e.Element;
    if (element.Name == "nav_home")
        ShowHomePage();
    else if (element.Name == "nav_user_list")
        ShowUserList();
};
```

### 22.3 AccordionControl 支持 HTML 模板

Accordion 各部分（项目、页脚、组、页眉面板等）均支持 HTML 模板：

```csharp
// 为 Accordion 组设置 HTML 模板
accordionControl1.HtmlTemplates.Add(new HtmlTemplate
{
    Id = "customGroup",
    Content = "<div class='group-title'>${Text}</div>"
});
// 在设计器或代码中关联模板 ID
```

### 22.4 与 NavBarControl 的区别

| 特性 | NavBarControl | AccordionControl |
|------|--------------|-----------------|
| 视觉风格 | Outlook 2007 风格 | 现代扁平折叠面板 |
| 嵌套层级 | 有限 | 支持更深层级 |
| HTML 模板 | 不支持 | 支持 |
| 皮肤支持 | 传统皮肤 | 新版矢量皮肤 |
| 推荐场景 | 旧项目兼容 | 新项目首选 |

