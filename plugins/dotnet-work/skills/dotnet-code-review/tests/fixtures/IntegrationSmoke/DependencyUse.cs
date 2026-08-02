namespace IntegrationSmoke;

public sealed class DependencyUse
{
    private readonly DependencyBase _dependency = new();

    public string GetName() => _dependency.Name;
}
