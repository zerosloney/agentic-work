# VGridControl 垂直网格

> 属性面板式编辑，四种布局模式 + DataSource 绑定 + 与 GridControl 区别。
> 本文件从 `advanced-features.md` §21 抽出（2026-08）。按需加载，标准流程不读。


> 程序集：`DevExpress.XtraVerticalGrid.v21.2.dll`，命名空间：`DevExpress.XtraVerticalGrid`。

VGridControl 将数据旋转 90° 显示（记录为列，字段为行），适合属性面板式编辑或单条记录详情展示。官方文档：`docs.devexpress.com/WindowsForms/116578/`。

### 21.1 四种布局模式

```csharp
VGridControl vGrid = new VGridControl();
vGrid.Dock = DockStyle.Fill;

// 1. 单记录布局（默认，PropertyGrid 风格）
vGrid.LayoutMode = DevExpress.XtraVerticalGrid.LayoutMode.Records;
// 每条记录一行，字段垂直排列

// 2. 分带布局（Banded）
vGrid.LayoutMode = DevExpress.XtraVerticalGrid.LayoutMode.Banded;
// 一个记录跨多列显示

// 3. 多记录布局（反向网格）
vGrid.LayoutMode = DevExpress.XtraVerticalGrid.LayoutMode.MultiRecords;
// 多个记录从左到右排列

// 4. 树形模式（分组可折叠）
vGrid.LayoutMode = DevExpress.XtraVerticalGrid.LayoutMode.Tree;
// 行可持有子行，展开/折叠

// 分组类别（Category Rows）
VGridCategoryRow categoryRow = new VGridCategoryRow("基本信息");
categoryRow.Expanded = true;
vGrid.Rows.Add(categoryRow);

// 添加字段行
VGridTextRow rowName = new VGridTextRow { Name = "Name", Caption = "姓名", Properties = { Value = "张三" } };
VGridTextRow rowAge = new VGridTextRow { Name = "Age", Caption = "年龄" };
vGrid.Rows.AddRange(new VGridRow[] { rowName, rowAge });
```

### 21.2 绑定 DataSource

```csharp
// 绑定 DataTable 或 List<T>
vGrid.DataSource = myDataTable;  // 每行 = DataTable 列

// 或绑定单条记录对象
vGrid.DataSource = new List<MyEntity> { currentEntity };
vGrid.RecordWidth = 300;  // 每条记录的宽度
```

### 21.3 排序和过滤（v21.1+）

```csharp
// v21.1 起支持行标题右键排序
vGrid.OptionsBehavior.AllowSort = true;  // 默认 true，设为 false 禁用

// 列过滤
vGrid.ActiveFilterString = "[Status] = 'Active'";
```

### 21.4 与 GridControl 的核心区别

| 特性 | GridControl | VGridControl |
|------|------------|-------------|
| 数据方向 | 行=记录，列=字段 | 行=字段，列=记录 |
| 适合场景 | 数据列表、主从表 | 属性面板、详情编辑 |
| 主从支持 | 内置 Detail View | 不支持 |
| 编辑方式 | 单元格编辑器 | 行级编辑器 |

