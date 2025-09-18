using DstMvp.Models;

namespace DstMvp.GameWorld;

// 地图瓦片类型：空地、树、灌木与营火
enum TileType
{
	Empty,
	Tree,
	Bush,
	Campfire
}

// 世界地图及逻辑：负责地形生成、采集、营火光照和更新
class World
{
	private readonly TileType[,] _tiles; // 地图网格
	private readonly List<Campfire> _campfires = new(); // 场景中的营火列表
	private readonly Random _random = new(); // 随机数生成器

	public int Width { get; }
	public int Height { get; }
	public int SpawnX { get; }
	public int SpawnY { get; }

	public World(int width, int height)
	{
		Width = width;
		Height = height;
		_tiles = new TileType[Width, Height];

		// 初始化地图为“空地”
		for (int y = 0; y < Height; y++)
		{
			for (int x = 0; x < Width; x++)
			{
				_tiles[x, y] = TileType.Empty;
			}
		}

		// 玩家出生点位于地图中心
		SpawnX = Width / 2;
		SpawnY = Height / 2;

		// 随机散布树与灌木（按比例）
		Scatter(TileType.Tree, count: (int)(Width * Height * 0.10));
		Scatter(TileType.Bush, count: (int)(Width * Height * 0.06));
	}

	// 随机在地图上放置指定数量的某类地形（避开出生点）
	private void Scatter(TileType type, int count)
	{
		int placed = 0;
		while (placed < count)
		{
			int x = _random.Next(0, Width);
			int y = _random.Next(0, Height);
			if (_tiles[x, y] == TileType.Empty && (x != SpawnX || y != SpawnY))
			{
				_tiles[x, y] = type;
				placed++;
			}
		}
	}

	// 边界检查：坐标是否在地图内
	public bool InBounds(int x, int y) => x >= 0 && y >= 0 && x < Width && y < Height;
	// 是否可行走：树木不可通过，空地与灌木可通过
	public bool IsWalkable(int x, int y) => _tiles[x, y] != TileType.Tree; // Can walk through bushes and on empty, but not through trees

	// 将地形类型映射为渲染字符
	public char GetGlyphAt(int x, int y)
	{
		return _tiles[x, y] switch
		{
			TileType.Empty => '.',
			TileType.Tree => 'T',
			TileType.Bush => 'B',
			TileType.Campfire => 'F',
			_ => '?'
		};
	}

	// 采集逻辑：树获得木材并清空为“空地”；灌木获得浆果，50% 几率被采尽
	public ItemType? GatherAt(int x, int y)
	{
		if (!InBounds(x, y)) return null;
		switch (_tiles[x, y])
		{
			case TileType.Tree:
				_tiles[x, y] = TileType.Empty;
				return ItemType.Wood;
			case TileType.Bush:
				// 50% 概率将灌木采尽
				if (_random.NextDouble() < 0.5) _tiles[x, y] = TileType.Empty;
				return ItemType.Berry;
			default:
				return null;
		}
	}

	// 在指定位置放置营火，并记录其剩余燃烧时间
	public void PlaceCampfire(int x, int y, double burnSeconds)
	{
		if (!InBounds(x, y)) return;
		_tiles[x, y] = TileType.Campfire;
		_campfires.Add(new Campfire { X = x, Y = y, TimeLeft = burnSeconds });
	}

	// 判断给定半径内是否存在仍在燃烧的营火
	public bool HasLightNear(int x, int y, int radius)
	{
		foreach (var fire in _campfires)
		{
			if (fire.TimeLeft <= 0) continue;
			int dx = fire.X - x;
			int dy = fire.Y - y;
			if (dx * dx + dy * dy <= radius * radius) return true;
		}
		return false;
	}

	// 更新所有营火的燃烧时间；燃尽后将地块恢复为空地并移除
	public void Update(double dt)
	{
		for (int i = _campfires.Count - 1; i >= 0; i--)
		{
			_campfires[i].TimeLeft -= dt;
			if (_campfires[i].TimeLeft <= 0)
			{
				// 熄灭营火并清理该地块
				_tiles[_campfires[i].X, _campfires[i].Y] = TileType.Empty;
				_campfires.RemoveAt(i);
			}
		}
	}
}

// 营火数据：位置与剩余燃烧时间
class Campfire
{
	public int X { get; set; }
	public int Y { get; set; }
	public double TimeLeft { get; set; }
}

