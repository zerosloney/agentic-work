namespace IntegrationSmoke;

public sealed class SemanticSample
{
    public string ReadWithNullForgiving(string? value)
    {
        return value!.Trim();
    }
}
