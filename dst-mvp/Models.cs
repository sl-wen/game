namespace dst_mvp;

enum ItemType
{
	Wood,
	Berry
}

class Inventory
{
	private readonly Dictionary<ItemType, int> _items = new();

	public void Add(ItemType type, int amount)
	{
		if (!_items.ContainsKey(type)) _items[type] = 0;
		_items[type] += amount;
	}

	public bool TryConsume(ItemType type, int amount)
	{
		if (!_items.TryGetValue(type, out int have) || have < amount) return false;
		_items[type] = have - amount;
		return true;
	}

	public int CountOf(ItemType type)
	{
		return _items.TryGetValue(type, out int have) ? have : 0;
	}
}

class Player
{
	public int X { get; set; }
	public int Y { get; set; }
	public double Hunger { get; set; } = 100;
	public double Health { get; set; } = 100;
	public Inventory Inventory { get; } = new Inventory();
	public bool HasTorch { get; set; } = false;
	public bool TorchLit { get; set; } = false;
	public double TorchTimeLeft { get; set; } = 60; // seconds

	public Player(int x, int y)
	{
		X = x;
		Y = y;
	}
}

