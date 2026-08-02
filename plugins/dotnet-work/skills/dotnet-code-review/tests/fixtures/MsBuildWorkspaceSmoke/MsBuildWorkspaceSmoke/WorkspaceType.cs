namespace MsBuildWorkspaceSmoke;

public static class WorkspaceType
{
    public static string ReadGenerated() => WorkspaceGenerated.Value;

    public static string ReadConditional() => DebugOnly.Value;

    public static string ReadNullable(string? value) => value!.Trim();
}
