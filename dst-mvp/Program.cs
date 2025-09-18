namespace dst_mvp;

class Program
{
    static void Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        Console.CursorVisible = false;
        var game = new Game();
        game.Run();
    }
}
