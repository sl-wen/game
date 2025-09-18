namespace dst_mvp;

enum TileType
{
	Empty,
	Tree,
	Bush,
	Campfire
}

class World
{
	private readonly TileType[,] _tiles;
	private readonly List<Campfire> _campfires = new();
	private readonly Random _random = new();

	public int Width { get; }
	public int Height { get; }
	public int SpawnX { get; }
	public int SpawnY { get; }

	public World(int width, int height)
	{
		Width = width;
		Height = height;
		_tiles = new TileType[Width, Height];

		// Fill empty
		for (int y = 0; y < Height; y++)
		{
			for (int x = 0; x < Width; x++)
			{
				_tiles[x, y] = TileType.Empty;
			}
		}

		SpawnX = Width / 2;
		SpawnY = Height / 2;

		Scatter(TileType.Tree, count: (int)(Width * Height * 0.10));
		Scatter(TileType.Bush, count: (int)(Width * Height * 0.06));
	}

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

	public bool InBounds(int x, int y) => x >= 0 && y >= 0 && x < Width && y < Height;
	public bool IsWalkable(int x, int y) => _tiles[x, y] != TileType.Tree; // Can walk through bushes and on empty, but not through trees

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

	public ItemType? GatherAt(int x, int y)
	{
		if (!InBounds(x, y)) return null;
		switch (_tiles[x, y])
		{
			case TileType.Tree:
				_tiles[x, y] = TileType.Empty;
				return ItemType.Wood;
			case TileType.Bush:
				// 50% chance to deplete
				if (_random.NextDouble() < 0.5) _tiles[x, y] = TileType.Empty;
				return ItemType.Berry;
			default:
				return null;
		}
	}

	public void PlaceCampfire(int x, int y, double burnSeconds)
	{
		if (!InBounds(x, y)) return;
		_tiles[x, y] = TileType.Campfire;
		_campfires.Add(new Campfire { X = x, Y = y, TimeLeft = burnSeconds });
	}

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

	public void Update(double dt)
	{
		for (int i = _campfires.Count - 1; i >= 0; i--)
		{
			_campfires[i].TimeLeft -= dt;
			if (_campfires[i].TimeLeft <= 0)
			{
				// Extinguish campfire tile
				_tiles[_campfires[i].X, _campfires[i].Y] = TileType.Empty;
				_campfires.RemoveAt(i);
			}
		}
	}
}

class Campfire
{
	public int X { get; set; }
	public int Y { get; set; }
	public double TimeLeft { get; set; }
}

