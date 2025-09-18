using System.Text;

namespace dst_mvp;

enum TimePhase
{
	Day,
	Night
}

class Game
{
	private const int TargetTicksPerSecond = 10;
	private const double SecondsPerTick = 1.0 / TargetTicksPerSecond;
	private const double DayLengthSeconds = 120.0;

	private readonly World _world;
	private readonly Player _player;
	private double _timeOfDaySeconds;
	private bool _running;

	public Game()
	{
		_world = new World(30, 15);
		_player = new Player(_world.SpawnX, _world.SpawnY);
		_timeOfDaySeconds = 0;
		_running = true;
	}

	public void Run()
	{
		DateTime nextTick = DateTime.UtcNow;
		while (_running)
		{
			HandleInput();
			Update(SecondsPerTick);
			Render();

			nextTick = nextTick.AddMilliseconds(100);
			var delay = nextTick - DateTime.UtcNow;
			if (delay.TotalMilliseconds > 0)
			{
				Thread.Sleep(delay);
			}
			else
			{
				nextTick = DateTime.UtcNow;
			}
		}
	}

	private void HandleInput()
	{
		while (Console.KeyAvailable)
		{
			var key = Console.ReadKey(true).Key;
			switch (key)
			{
				case ConsoleKey.W:
					TryMove(0, -1);
					break;
				case ConsoleKey.S:
					TryMove(0, 1);
					break;
				case ConsoleKey.A:
					TryMove(-1, 0);
					break;
				case ConsoleKey.D:
					TryMove(1, 0);
					break;
				case ConsoleKey.E:
					Gather();
					break;
				case ConsoleKey.F:
					CraftCampfire();
					break;
				case ConsoleKey.T:
					CraftTorch();
					break;
				case ConsoleKey.L:
					ToggleTorch();
					break;
				case ConsoleKey.Q:
					_running = false;
					break;
			}
		}
	}

	private void TryMove(int dx, int dy)
	{
		int nx = _player.X + dx;
		int ny = _player.Y + dy;
		if (_world.InBounds(nx, ny) && _world.IsWalkable(nx, ny))
		{
			_player.X = nx;
			_player.Y = ny;
		}
	}

	private void Gather()
	{
		// Gather from current tile first, then adjacent tiles
		CollectFrom(_player.X, _player.Y);
		CollectFrom(_player.X + 1, _player.Y);
		CollectFrom(_player.X - 1, _player.Y);
		CollectFrom(_player.X, _player.Y + 1);
		CollectFrom(_player.X, _player.Y - 1);
	}

	private void CollectFrom(int x, int y)
	{
		if (!_world.InBounds(x, y)) return;
		var drop = _world.GatherAt(x, y);
		if (drop != null)
		{
			_player.Inventory.Add(drop.Value, 1);
		}
	}

	private void CraftCampfire()
	{
		if (_player.Inventory.TryConsume(ItemType.Wood, 3))
		{
			_world.PlaceCampfire(_player.X, _player.Y, burnSeconds: 60);
		}
	}

	private void CraftTorch()
	{
		if (_player.HasTorch) return;
		if (_player.Inventory.TryConsume(ItemType.Wood, 2))
		{
			_player.HasTorch = true;
		}
	}

	private void ToggleTorch()
	{
		if (!_player.HasTorch) return;
		if (_player.TorchTimeLeft <= 0) return;
		_player.TorchLit = !_player.TorchLit;
	}

	private void Update(double dt)
	{
		_timeOfDaySeconds += dt;
		if (_timeOfDaySeconds >= DayLengthSeconds)
		{
			_timeOfDaySeconds -= DayLengthSeconds;
		}

		_world.Update(dt);

		bool isNight = GetPhase() == TimePhase.Night;
		bool hasLight = _world.HasLightNear(_player.X, _player.Y, radius: 4) || (_player.TorchLit && _player.TorchTimeLeft > 0);
		bool inDarkness = isNight && !hasLight;

		// Hunger drains always
		_player.Hunger = Math.Max(0, _player.Hunger - 0.02);
		if (_player.Hunger <= 0)
		{
			_player.Health = Math.Max(0, _player.Health - 0.2);
		}

		if (inDarkness)
		{
			_player.Health = Math.Max(0, _player.Health - 0.2);
		}

		if (_player.TorchLit && _player.TorchTimeLeft > 0)
		{
			_player.TorchTimeLeft = Math.Max(0, _player.TorchTimeLeft - dt);
			if (_player.TorchTimeLeft <= 0)
			{
				_player.TorchLit = false;
			}
		}

		if (_player.Health <= 0)
		{
			_running = false;
		}
	}

	private TimePhase GetPhase()
	{
		// Simple split: 70% day, 30% night
		double ratio = _timeOfDaySeconds / DayLengthSeconds;
		return ratio < 0.7 ? TimePhase.Day : TimePhase.Night;
	}

	private void Render()
	{
		Console.SetCursorPosition(0, 0);
		var sb = new StringBuilder();
		for (int y = 0; y < _world.Height; y++)
		{
			for (int x = 0; x < _world.Width; x++)
			{
				char ch = _world.GetGlyphAt(x, y);
				if (x == _player.X && y == _player.Y) ch = '@';
				sb.Append(ch);
			}
			sb.Append('\n');
		}

		bool isNight = GetPhase() == TimePhase.Night;
		bool hasLight = _world.HasLightNear(_player.X, _player.Y, 4) || (_player.TorchLit && _player.TorchTimeLeft > 0);
		bool inDarkness = isNight && !hasLight;

		int wood = _player.Inventory.CountOf(ItemType.Wood);
		int berries = _player.Inventory.CountOf(ItemType.Berry);
		string phase = isNight ? "Night" : "Day";
		sb.Append($"Time: {phase}  Hunger: {_player.Hunger,5:0.0}  Health: {_player.Health,5:0.0}  Wood: {wood}  Berries: {berries}  Torch: {( _player.HasTorch ? (_player.TorchLit ? "Lit" : "Unlit") : "None")} ({_player.TorchTimeLeft,5:0.0}s)\n");
		sb.Append("Controls: WASD=move  E=gather  F=campfire(3 wood)  T=torch(2 wood)  L=toggle torch  Q=quit\n");
		if (inDarkness) sb.Append("It is dark! Find light!\n");

		Console.Write(sb.ToString());
	}
}

