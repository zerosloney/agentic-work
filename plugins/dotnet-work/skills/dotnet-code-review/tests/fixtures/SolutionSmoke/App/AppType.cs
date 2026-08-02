using SolutionSmoke.Core;

namespace SolutionSmoke.App;

public sealed class AppType
{
    public string Read(CoreType value) => value.Name!.Trim();
}
