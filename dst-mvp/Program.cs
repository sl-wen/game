using DstMvp.Gameplay;

namespace DstMvp;

class Program
{
    // 应用程序入口点
    static void Main(string[] args)
    {
        // 确保控制台能正确显示 UTF-8 字符
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        // 隐藏光标以提升渲染体验
        Console.CursorVisible = false;
        // 创建游戏实例并开始主循环
        var game = new Game();
        game.Run();
    }
}
