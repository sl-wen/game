namespace dst_mvp;

// 物品类型枚举：当前仅包含木材和浆果
enum ItemType
{
	Wood,
	Berry
}

// 简单的背包系统：记录每种物品的数量
class Inventory
{
	private readonly Dictionary<ItemType, int> _items = new();

	// 向背包中添加指定数量的物品
	public void Add(ItemType type, int amount)
	{
		if (!_items.ContainsKey(type)) _items[type] = 0;
		_items[type] += amount;
	}

	// 消耗指定数量的物品；若数量不足则返回 false
	public bool TryConsume(ItemType type, int amount)
	{
		if (!_items.TryGetValue(type, out int have) || have < amount) return false;
		_items[type] = have - amount;
		return true;
	}

	// 查询某种物品的数量，若不存在则返回 0
	public int CountOf(ItemType type)
	{
		return _items.TryGetValue(type, out int have) ? have : 0;
	}
}

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

