# 特殊功能代码模板

> 本文件由 SKILL.md Step 4 按需加载。仅在用户要求对应高级功能时读取；不要全量加载，按下表定位章节。
> **2026-08 重组**：§1（状态颜色）/§8（行号）/§10（TreeList 拖拽）已移至 gridview/treelist-advanced 避免重复；§20-23（HTML 模板/VGrid/Accordion/DirectX）已抽为独立手册。本文件保留项目特有杂项（右键菜单/分页/导出/权限菜单/级联验证/SplitContainer+DockPanel/XtraTabControl 等）。

## 需求关键词 → 章节速查(优先用这张表)

> 用户提到下列关键词或要实现对应功能时,只读对应章节,不读全文件。

| 用户需求 / 关键词 | 章节 |
|------------------|------|
| "状态颜色" / "按状态变色" / "审批通过的行高亮" | `references/gridview-advanced.md`（GV）/ `references/treelist-advanced.md`（TL） |
| "右键菜单" / "ContextMenuStrip" / "右键增删改" | §2(Upgrader) / §6(CRS) / §7(空数据保护) |
| "分页" / "下一页" / "每页 50 条" | §3 |
| "导出 Excel" / "导出" / "cmsExport" | §4（或见 `references/print-export.md`） |
| "深拷贝" / "DeepClone" / "编辑时不影响原数据" | §5 |
| "权限菜单" / "AddControlItemGroupConfig" / "按钮权限" | §6(CRS 专用) |
| "行号" / "序号列" / "CustomDrawRowIndicator" | `references/gridview-advanced.md` |
| "校验" / "必填" / "验证输入" / "保存前检查" | §9 / §16 |
| "拖拽" / "拖动节点" / "TreeList DragDrop" | `references/treelist-advanced.md` |
| "多选下拉" / "GridLookUpEdit 勾选" / "GridCheckMarksSelection" | §11 |
| "等待窗体" / "WaitDialog" / "varlist_Dialog" | §12 |
| "报表" / "打印" / "ReportDesign" / "ShowReportView" | §13 |
| "CSS.DAL" / "DALBase<T>" / "CSS 子模式 ORM" | §14 |
| "日期列" / "下拉列" / "勾选列" / "RepositoryItem" | §15 / §1.4(designer-patterns) |
| "级联填充" / "CellValueChanging" / "选 A 自动填 B" | §16 |
| "下拉树" / "TreeListLookUpEdit" | §17 |
| "左右分栏" / "SplitContainer" / "DockPanel 浮动面板" | §18 / §1.2 §1.5(designer-patterns) |
| "多 Tab" / "标签页" / "基本信息+明细" / "XtraTabControl" | §19 / §1.6(designer-patterns) |
| "条件格式" / "StyleFormatCondition" / "RowCellStyle" | `references/gridview-advanced.md` |
| "汇总" / "统计" / "合计" / "Count/Sum" | `references/gridview-advanced.md` |
| "排序" / "多列排序" / "AllowSort" | `references/gridview-advanced.md` |
| "筛选" / "过滤" / "ActiveFilterString" | `references/gridview-advanced.md` |
| "TreeList 拖拽" / "节点移动" / "主从联动" | `references/treelist-advanced.md` |
| "编辑器配置" / "DateEdit" / "LookUpEdit" / "SpinEdit" | `references/editors-reference.md` |
| "Table Layout" / "网格布局" / "LayoutControl 分组" | `references/layout-advanced.md` |
| "打印" / "导出 Excel" / "ExportToXlsx" | `references/print-export.md` |
| "HTML 模板" / "TileView" / "CardView HTML" / "WinExplorer HTML" | `references/html-template-advanced.md` |
| "VGrid" / "垂直网格" / "属性面板" | `references/vgrid-control-advanced.md` |
| "Accordion" / "手风琴" / "折叠菜单" | `references/accordion-control-advanced.md` |
| "DirectX" / "DirectXForm" / "硬件加速表单" | `references/directx-form-advanced.md` |

## 章节索引(按编号)

| 功能 | 章节 |
|------|------|
| 状态颜色渲染 | → `gridview-advanced.md`（GV）/ `treelist-advanced.md`（TL） |
| 右键菜单 | §2 |
| 分页加载 | §3 |
| 导出 Excel | §4 |
| 深拷贝 | §5 |
| CRS 权限菜单 | §6 |
| GridControl 右键菜单空数据保护 | §7 |
| 行号显示 | → `gridview-advanced.md` |
| 验证输入 | §9 |
| TreeList 拖拽 / 主从联动 / 展开菜单 | → `treelist-advanced.md` |
| GridLookUpEdit 多选 | §11 |
| varlist_Dialog | §12 |
| 报表打印 | §13 |
| CSS 子模式 DALBase<T> | §14 |
| RepositoryItem 自定义编辑器 | §15 |
| Grid / TreeList 联动验证 | §16 |
| TreeListLookUpEdit 下拉树 | §17 |
| SplitContainer + DockPanel 布局 | §18 |
| XtraTabControl 多标签页 | §19 |
| HTML & CSS 模板（v21.2） | `references/html-template-advanced.md` |
| VGridControl 垂直网格 | `references/vgrid-control-advanced.md` |
| Accordion Control 手风琴导航 | `references/accordion-control-advanced.md` |
| DirectX Form（v22.1） | `references/directx-form-advanced.md` |

## 1. 状态颜色渲染

> 已移至专题手册（避免与 gridview/treelist-advanced 重复）：
> - GridView 版本（RowCellStyle 事件）：见 `references/gridview-advanced.md` 条件格式节
> - TreeList 版本（CustomDrawNodeCell）：见 `references/treelist-advanced.md` 条件格式节

## 2. 右键菜单（ContextMenuStrip）

### Deve-Upgrader 模式

菜单在 Designer.cs 中声明，通过 `MouseDown+MouseUp` 控制：

```csharp
// Designer.cs 中的菜单项声明
private System.Windows.Forms.ToolStripMenuItem cmsAdd;
private System.Windows.Forms.ToolStripMenuItem cmsUpdate;
private System.Windows.Forms.ToolStripMenuItem cmsDelete;
private System.Windows.Forms.ToolStripMenuItem cmsRefresh;
private System.Windows.Forms.ToolStripMenuItem cmsExport;

// 窗体代码中的事件处理
private GridHitInfo _ghi;

private void gv_MouseDown(object sender, MouseEventArgs e)
{
    _ghi = gv.CalcHitInfo(new Point(e.X, e.Y));
}

private void gv_MouseUp(object sender, MouseEventArgs e)
{
    if (!gv.MenuControl(sender, e, _ghi)) return;
    cmsDelete.Enabled = gv.GetRow(_ghi.RowHandle) as EntityX != null;
    cmsUpdate.Enabled = gv.GetRow(_ghi.RowHandle) as EntityX != null;
    cms.Show(gc, e.X, e.Y);
}
```

### Deve-CRS 模式

CRS 使用 `AddControlItemGroupConfig` 注册权限菜单，详见第 6 节。

## 3. 分页加载

```csharp
private int _pageSize = 50;
private int _pageIndex = 1;
private int _totalCount = 0;

private void LoadData()
{
    var result = _ser.GetPagedData(_pageSize, _pageIndex, BuildCondition());
    _totalCount = result.TotalCount;
    _view.DataList = result.DataList;
    UpdatePagerInfo();
}

private void btnPrev_Click(object sender, EventArgs e)
{
    if (_pageIndex > 1) { _pageIndex--; LoadData(); }
}

private void btnNext_Click(object sender, EventArgs e)
{
    int totalPages = (int)Math.Ceiling(_totalCount / (double)_pageSize);
    if (_pageIndex < totalPages) { _pageIndex++; LoadData(); }
}
```

## 4. 导出 Excel

### Deve-Upgrader

```csharp
private GridUI _gridUI = new GridUI();

private void cmsExport_Click(object sender, EventArgs e)
{
    _gridUI.ExportExcel(gcMain, "导出文件名");
}

// TreeList 导出
private TreeListUI _tlUI = new TreeListUI();
_tlUI.ExportExcel(tlMain);
```

### Deve-CRS

```csharp
// ExportDefault 扩展方法（弹出保存对话框）
private void cmsExport_Click(object sender, EventArgs e)
{
    gcMain.ExportDefault("导出文件名");
}

// TreeList 导出
private void cmsTreeExport_Click(object sender, EventArgs e)
{
    tlMain.ExportDefault("导出文件名");
}
```

## 5. 深拷贝（DeepClone）

防止直接修改数据源中的对象，创建独立副本后编辑：

```csharp
using Jamtc.Common.Extend;

// 在编辑对话框中使用
var clonedEntity = Jamtc.Common.Extend.EntityExtend.DeepClone(originalEntity) as OrderInfo;
// 用户在对话框中修改 clonedEntity，确认后才同步回数据源
```

## 6. AddControlItemGroupConfig 权限菜单（仅 CRS）

在 `frm_Base` 子类构造函数中注册：

```csharp
// 右键菜单绑定到 GridControl
AddControlItemGroupConfig(new ControlItemGroupConfig("默认菜单", cms, gcProjectInfo));

// 右键菜单绑定到 TreeList
AddControlItemGroupConfig(new ControlItemGroupConfig("班组菜单", cms_WorkGroup, tl_WorkGroup));

// 按钮绑定
AddControlItemGroupConfig(new ControlItemGroupConfig("操作功能", btnRefresh));
AddControlItemGroupConfig(new ControlItemGroupConfig("操作功能", btnInsert));
AddControlItemGroupConfig(new ControlItemGroupConfig("操作功能", btnUpdate));
AddControlItemGroupConfig(new ControlItemGroupConfig("操作功能", btnDelete));
```

## 7. GridControl 右键菜单空数据保护

```csharp
// Deve-Upgrader 中 GridControl 的 MenuControlExceptDataSource 拓展
private void gv_MouseUp(object sender, MouseEventArgs e)
{
    if (!GridControlExtendMethods.MenuControlExceptDataSource(e, _ghi, gvMain))
        return;
    // 控制菜单项状态...
}

// Deve-CRS 中 GridControl 的自定义右键（不使用 AddControlItemGroupConfig 时）
private void gv_MouseUp(object sender, MouseEventArgs e)
{
    if (e.Button != MouseButtons.Right) return;
    var hitInfo = gv.CalcHitInfo(new Point(e.X, e.Y));
    if (hitInfo == null || hitInfo.InRowCell == false) return;

    var row = gv.GetRow(hitInfo.RowHandle) as EntityX;
    cmsUpdate.Enabled = row != null;
    cms.Show(gc, e.X, e.Y);
}
```

## 8. 行号显示

> 已移至 `references/gridview-advanced.md` 行号显示节（CustomDrawRowIndicator 实现，避免重复）。

## 9. 验证输入

输入校验：按参照窗体的校验风格实现，常见为 `string.IsNullOrEmpty` 检查 + 消息提示。

## 10. TreeList 拖拽 / 主从联动 / 展开菜单

> 已移至 `references/treelist-advanced.md`（标准拖放节点类型验证 + DB 同步、FocusedNodeChanged 主从联动、InitExpandAndCollapse 展开/收缩菜单，全覆盖，避免重复）。

## 11. GridLookUpEdit 多选

用于 GridLookUpEdit 的下拉列表多选场景。

> ⚠️ `GridCheckMarksSelection` 是**自定义包装类**（非 DevExpress 内置），多个博客有完整源码。其核心原理：给下拉 View 注入一列复选框 + 监听 `SelectionChanged`。如果项目已有该类直接用；没有则用下面的原生 API 写法。

### 方式一：原生 API（推荐）

```csharp
// 初始化
cboField.Properties.DataSource = dataSource;
cboField.Properties.ValueMember = "ID";
cboField.Properties.DisplayMember = "Name";
cboField.Properties.View.OptionsSelection.MultiSelect = true;
cboField.Properties.View.OptionsSelection.MultiSelectMode = MultiSelectMode.RowSelect;

// 监听选中变更
cboField.Properties.View.SelectedRowsChanged += (s, e) =>
{
    _selectedItems.Clear();
    foreach (int rowHandle in cboField.Properties.View.GetSelectedRows())
        _selectedItems.Add(cboField.Properties.View.GetRow(rowHandle));
};

// 自定义显示文本
cboField.CustomDisplayText += (sender, e) =>
{
    e.DisplayText = string.Join(", ", _selectedItems.Select(x => x.Name));
};
```

### 方式二：GridCheckMarksSelection（项目已有此类时用）

```csharp
private GridCheckMarksSelection _gridCheckMarksSA;

_gridCheckMarksSA = new GridCheckMarksSelection(cboField.Properties);
_gridCheckMarksSA.SelectionChanged += gridCheckMarks_SelectionChanged;
cboField.Properties.Tag = _gridCheckMarksSA;

// 选中项变更
private void gridCheckMarks_SelectionChanged(object sender, EventArgs e)
{
    _selectedItems.Clear();
    foreach (var item in _gridCheckMarksSA.Selection)
        _selectedItems.Add(item);
}
```

## 12. varlist_Dialog

varlist_Dialog 调用方式见各 UI 模板（`upgrader-ui.md` / `crs-ui.md`）。

## 13. 报表打印（ReportDesign）

通过 `Jamtc.ReportDesign.ReportDesignConfigSer.ShowReportView()` 调用：

```csharp
using Jamtc.ReportDesign;

// 有参数的报表
Dictionary<string, object> dicParams = new Dictionary<string, object>();
dicParams.Add("参数名", 参数值);
ReportDesignConfigSer.ShowReportView("报表编码", dicParams, dataSourceList);

// 无参数的报表
ReportDesignConfigSer.ShowReportView("报表编码", null, dataSourceList);

// XtraReport 对象方式
XtraReport report = new XtraReport_ReportName();
report.CreateDocument();
ReportDesignConfigSer.ShowReportView(report, false);
```

报表编码如 `"YQTDJ"`、`"GCXLD(ACL)ZBB"` 等由项目预定义。

## 14. CSS 子模式 DALBase<T>（Deve-Upgrader CSS 分支）

当目标使用 `CSS.DAL/` + `CSS.BLL/` 目录时，用 ORM 而非 SqlOperate：

```csharp
using CSS.DAL.Utils;

public class DAL{业务名} : DALBase<{实体类}>
{
    public List<{实体类}> QueryByProject(string id)
    {
        return DbHelp.Query<{实体类}>()
            .Where(n => n.ProjectInfoID == id)
            .ToList();
    }
}

// Ser 层
public class {业务名}Ser
{
    private DAL{业务名} _dal = new DAL{业务名}();
    public List<{实体类}> GetData(string id)
    {
        return _dal.QueryByProject(id);
    }
}
```

`DALBase<T>` 支持事务感知、多数据库切换（`DBConnectType`）、自动 Bulk 插入（>50 条）。

## 15. RepositoryItem 自定义编辑器

在 Designer 中声明 RepositoryItem，通过 `ColumnEdit` 绑定到列：

```csharp
// Designer 声明
this.repositoryItemDateEdit1 = new RepositoryItemDateEdit();
this.repositoryItemComboBox1 = new RepositoryItemComboBox();
this.repositoryItemHyperLinkEdit1 = new RepositoryItemHyperLinkEdit();
this.repositoryItemCheckEdit1 = new RepositoryItemCheckEdit();

// GridControl 注册（Designer）
this.gcMain.RepositoryItems.AddRange(new RepositoryItem[] {
    this.repositoryItemDateEdit1,
    this.repositoryItemHyperLinkEdit1
});

// 列绑定
bandedGridColumn24.ColumnEdit = this.repositoryItemHyperLinkEdit1;
colCreateDate.ColumnEdit = this.repositoryItemDateEdit1;

// RepositoryItemDateEdit 配置
this.repositoryItemDateEdit1.Buttons.AddRange(new EditorButton[] {
    new EditorButton(ButtonPredefines.Combo)
});
this.repositoryItemDateEdit1.Mask.EditMask = "yyyy-MM-dd";

// RepositoryItemCheckEdit 配置（布尔列）
repositoryItemCheckEdit1.ValueChecked = "TRUE";
repositoryItemCheckEdit1.ValueUnchecked = "FALSE";
repositoryItemCheckEdit1.AllowGrayed = false;
```

同一个 RepositoryItem 可绑定多个列（共享实例）。

## 16. Grid 联动验证（CellValueChanging + ValidatingEditor）

> 陷阱：`ShownEditor` 和 `EditValueChanging` 在某些场景会冲突，见 `references/common-pitfalls.md` § 15。

### 官方标准级联查找 API（两种方式）

#### 方式一：Grid 内嵌 LookUpEdit（ShownEditor 拦截）

适用于 GridView 内嵌的下拉列。官方文档源码（`docs.devexpress.com/WindowsForms/116018/`）：

```csharp
// 在 ShownEditor 事件中拦截，动态修改下拉数据源
private void gridView1_ShownEditor(object sender, EventArgs e)
{
    if (gridView1.FocusedColumn.FieldName == "ProductID")
    {
        var lookup = gridView1.ActiveEditor as LookUpEdit;
        if (lookup == null) return;

        // 取当前行的 CategoryID 作为过滤条件
        int categoryId = Convert.ToInt32(gridView1.GetFocusedRowCellValue("CategoryID"));
        lookup.Properties.DataSource = Product.GetProductsByCategory(categoryId);
    }
}
```

> 注意：此方式在每次进入编辑状态时重新过滤下拉数据。适合 Grid 内嵌的 RepositoryItemLookUpEdit 列。

#### 方式二：Standalone LookUpEdit（CascadingOwner 属性）

适用于表单上独立的两个 LookUpEdit 控件。官方文档源码：

```csharp
// 设置父级下拉
lookupCategory.Properties.DataSource = Category.Init();
lookupCategory.Properties.DisplayMember = "CategoryName";
lookupCategory.Properties.ValueMember = "CategoryID";

// 设置子级下拉，指定 CascadingOwner
lookupProduct.Properties.DataSource = Product.Init();
lookupProduct.Properties.DisplayMember = "Name";
lookupProduct.Properties.ValueMember = "ProductID";
lookupProduct.CascadingOwner = lookupCategory;  // ← 官方标准写法

// 父级变化时清空子级选择
private void lookupCategory_EditValueChanged(object sender, EventArgs e)
{
    lookupProduct.EditValue = null;
}
```

> `CascadingOwner` 是 DevExpress **21.1+** 内置属性，自动在父级值变化时过滤子级数据源。仅适用于 Standalone LookUpEdit 控件，不适用于 Grid 内嵌列。

### 旧版 CellValueChanging 方式（项目内仍可用）

选择下拉项后自动填充关联字段：

```csharp
private void gvDetail_CellValueChanging(object sender, CellValueChangedEventArgs e)
{
    var entity = gvDetail.GetRow(e.RowHandle) as EntityClass;
    if (entity == null) return;

    if (e.Column == colLookupField)
    {
        var lookupItem = _lookupList.FirstOrDefault(n => n.ID == (Guid)e.Value);
        if (lookupItem == null) return;

        entity.DpCName = lookupItem.DpCName;
        entity.WBSName = lookupItem.WBSName;
        entity.OrgID = lookupItem.OrgID;
        gvDetail.RefreshData();
    }
}
```

### TreeList 列校验（ValidatingEditor）

```csharp
private void tlMain_ValidatingEditor(object sender, BaseContainerValidateEditorEventArgs e)
{
    if (tlMain.FocusedColumn.FieldName == "UnitPrice")
    {
        if (string.IsNullOrWhiteSpace(Convert.ToString(e.Value)))
            e.Value = 0m;  // 空值默认 0
    }
}
```

### 保存前全量校验（ok() 方法中）

重写 `ok()` 方法，遍历明细列表做必填项/数值范围校验，失败时调用 `UICommonBase.ShowMessageBox(MessageType.Warming, "...")` 并返回 `false`。

## 17. TreeListLookUpEdit 下拉树

> 官方 API：`TreeListLookUpEdit.Properties.TreeList` 返回标准 `TreeList` 实例。**不是** `TreeListExtend`（那是项目自定义类）。

```csharp
// 声明
private TreeListLookUpEdit tllueDepartment;

// === Designer 初始化 ===
// TreeListLookUpEdit 自动创建内部 TreeList，访问 Properties.TreeList 操作列
this.tllueDepartment = new TreeListLookUpEdit();
this.tllueDepartment.Properties.Buttons.AddRange(new EditorButton[] {
    new EditorButton(ButtonPredefines.Combo)
});
this.tllueDepartment.Properties.DisplayMember = "Name";
this.tllueDepartment.Properties.ValueMember = "ID";
this.tllueDepartment.Properties.NullText = "";

// 内部 TreeList 列配置（通过 Properties.TreeList）
var tl = this.tllueDepartment.Properties.TreeList;
tl.Columns.Clear();
tl.Columns.Add(new TreeListColumn { Caption = "名称", FieldName = "Name", Visible = true });
tl.Columns.Add(new TreeListColumn { Caption = "编码", FieldName = "Code", Visible = false });
tl.KeyFieldName = "ID";
tl.ParentFieldName = "ParentID";
tl.OptionsView.ShowIndicator = false;
tl.OptionsView.ShowAutoFilterRow = true;
tl.OptionsFilter.FilterMode = FilterMode.EntireBranch; // 整支过滤

// === 运行时绑定 ===
tllueDepartment.Properties.DataSource = treeDataSource;
tllueDepartment.Properties.TreeList.ExpandAll();

// === 取值 ===
// 单选：tllueDepartment.EditValue 返回 ID
// 多选（带 CheckBox）：tl.Nodes遍历，手动判断 CheckState != CheckState.Unchecked

// === 自定义显示文本（多选时）===
tllueDepartment.Properties.CustomDisplayText += (sender, e) =>
{
    // 拼接已选节点名称
    e.DisplayText = GetCheckedNodeNames(tllueDepartment.Properties.TreeList);
};
```

## 18. SplitContainer + DockPanel 布局

### 标准 TreeList + Splitter + GridControl

```
LayoutControl (Dock.Fill)
├── splitContainerControl1 (Vertical)
│   Panel1: tlMain (TreeList)
│   Panel2: gcDetail (GridControl)
```

```csharp
// Designer
this.splitContainerControl1 = new SplitContainerControl();
this.splitContainerControl1.Dock = DockStyle.Fill;
this.splitContainerControl1.SplitterPosition = 300;
this.splitContainerControl1.Panel1.Controls.Add(this.tlMain);
this.splitContainerControl1.Panel2.Controls.Add(this.gcDetail);
```

### DockManager + DockPanel 右侧面板

```csharp
// Designer
this.dmDisplay = new DockManager(this.components);
this.dmDisplay.Form = this;

this.dpDisplay = new DockPanel();
this.dpDisplay.Dock = DockingStyle.Right;
this.dpDisplay.Options.FloatOnDblClick = false;
this.dpDisplay.Options.ShowCloseButton = false;
this.dpDisplay.Text = "预览面板";

this.dmDisplay.RootPanels.AddRange(new DockPanel[] { this.dpDisplay });
this.dockPanel1_Container.Controls.Add(this.previewControl);
```

## 19. XtraTabControl 多标签页

每个标签页包含独立的 TreeList 或 GridControl：

```csharp
// Designer
this.xtraTabControl1 = new XtraTabControl();
this.xtraTabPage1 = new XtraTabPage();  // Text = "船体"
this.xtraTabPage2 = new XtraTabPage();  // Text = "舾装"

this.xtraTabControl1.TabPages.AddRange(new XtraTabPage[] {
    this.xtraTabPage1, this.xtraTabPage2
});

// 每个 TabPage 承载独立控件
this.xtraTabPage1.Controls.Add(this.tlHullData);
this.xtraTabPage2.Controls.Add(this.tlOutfitData);

// 标签切换事件
this.xtraTabControl1.SelectedPageChanged += TabControl_SelectedPageChanged;

// 运行时检测当前标签
if (xtraTabControl1.SelectedTabPage.Text.Contains("船体"))
    LoadHullData();
```

### 分步加载模式（避免首屏卡顿）

```csharp
private void frm_Load(object sender, EventArgs e)
{
    xtraTabControl1.SelectedTabPage = xtraTabPage3;  // 先切到最后页
    LoadTab3Data();

    xtraTabControl1.SelectedTabPage = xtraTabPage2;  // 加载第二页
    LoadTab2Data();

    xtraTabControl1.SelectedTabPage = xtraTabPage1;  // 最后切回首屏
    LoadTab1Data();
}
```


