namespace RuntimeSmoke;

public sealed class RuntimeSmokeSample
{
    public async void BrokenAsyncHandler()
    {
        await Task.Delay(1);
    }
}
