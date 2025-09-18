namespace DstMvp.Models;

// 玩家数据结构：位置、饥饿、生命、背包与火把状态
class Player
{
	public int X { get; set; }
	public int Y { get; set; }
	public double Hunger { get; set; } = 100; // 饥饿值（0~100），会随时间降低
	public double Health { get; set; } = 100; // 生命值（0~100），饥饿或黑暗会扣减
	public Inventory Inventory { get; } = new Inventory(); // 玩家背包
	public bool HasTorch { get; set; } = false; // 是否已制作火把
	public bool TorchLit { get; set; } = false; // 火把是否点燃
	public double TorchTimeLeft { get; set; } = 60; // 火把剩余燃烧时间（秒）

	public Player(int x, int y)
	{
		X = x;
		Y = y;
	}
}

