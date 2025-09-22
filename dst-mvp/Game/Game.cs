using System.Text;
using DstMvp.GameWorld;
using DstMvp.Models;

namespace DstMvp.Gameplay;

// 时间阶段：白天/夜晚
enum TimePhase
{
	Day,
	Night
}

// 游戏主循环与输入/更新/渲染逻辑
class Game
{
	private const int TargetTicksPerSecond = 10; // 每秒目标逻辑帧数
	private const double SecondsPerTick = 1.0 / TargetTicksPerSecond; // 每帧时长（秒）
	private const double DayLengthSeconds = 120.0; // 一个昼夜循环的时长（秒）

	private readonly World _world; // 世界地图
	private readonly Player _player; // 玩家实例
	private double _timeOfDaySeconds; // 当前昼夜时间（循环）
	private bool _running; // 游戏是否继续运行

	public Game()
	{
		_world = new World(30, 15); // 创建一个 30x15 的世界
		_player = new Player(_world.SpawnX, _world.SpawnY); // 玩家出生在地图中心
		_timeOfDaySeconds = 0;
		_running = true;
	}

	// 主循环：处理输入、更新逻辑、渲染输出，并维持固定步进
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
				nextTick = DateTime.UtcNow; // 若掉帧则重置节拍
			}
		}
	}

	// 输入处理：WASD 移动，E 采集，F 篝火，T 火把，L 切换火把，Q 退出
	private void HandleInput()
	{
		// 检查是否可以读取按键（处理重定向输入的情况）
		if (!Console.IsInputRedirected && Console.KeyAvailable)
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

	// 试图移动玩家，若目标格在边界内且可行走则更新坐标
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

	// 采集：先采集脚下，再采集四邻格
	private void Gather()
	{
		// Gather from current tile first, then adjacent tiles
		CollectFrom(_player.X, _player.Y);
		CollectFrom(_player.X + 1, _player.Y);
		CollectFrom(_player.X - 1, _player.Y);
		CollectFrom(_player.X, _player.Y + 1);
		CollectFrom(_player.X, _player.Y - 1);
	}

	// 从指定格尝试采集，若有掉落则加入背包
	private void CollectFrom(int x, int y)
	{
		if (!_world.InBounds(x, y)) return;
		var drop = _world.GatherAt(x, y);
		if (drop != null)
		{
			_player.Inventory.Add(drop.Value, 1);
		}
	}

	// 制作篝火：消耗 3 木材，在当前位置放置，持续 60 秒
	private void CraftCampfire()
	{
		if (_player.Inventory.TryConsume(ItemType.Wood, 3))
		{
			_world.PlaceCampfire(_player.X, _player.Y, burnSeconds: 60);
		}
	}

	// 制作火把：若未拥有且木材足够（2 木），则获得火把
	private void CraftTorch()
	{
		if (_player.HasTorch) return;
		if (_player.Inventory.TryConsume(ItemType.Wood, 2))
		{
			_player.HasTorch = true;
		}
	}

	// 切换火把点燃状态：需要拥有火把且仍有燃烧时间
	private void ToggleTorch()
	{
		if (!_player.HasTorch) return;
		if (_player.TorchTimeLeft <= 0) return;
		_player.TorchLit = !_player.TorchLit;
	}

	// 每帧更新：推进昼夜时间、更新世界、结算饥饿与黑暗伤害、消耗火把时间
	private void Update(double dt)
	{
		_timeOfDaySeconds += dt;
		if (_timeOfDaySeconds >= DayLengthSeconds)
		{
			_timeOfDaySeconds -= DayLengthSeconds; // 循环归零
		}

		_world.Update(dt);

		bool isNight = GetPhase() == TimePhase.Night;
		bool hasLight = _world.HasLightNear(_player.X, _player.Y, radius: 4) || (_player.TorchLit && _player.TorchTimeLeft > 0);
		bool inDarkness = isNight && !hasLight;

		// 饥饿值持续下降
		_player.Hunger = Math.Max(0, _player.Hunger - 0.02);
		if (_player.Hunger <= 0)
		{
			_player.Health = Math.Max(0, _player.Health - 0.2);
		}

		// 夜晚且无光照时掉血
		if (inDarkness)
		{
			_player.Health = Math.Max(0, _player.Health - 0.2);
		}

		// 若火把点燃则消耗剩余时间，用尽后自动熄灭
		if (_player.TorchLit && _player.TorchTimeLeft > 0)
		{
			_player.TorchTimeLeft = Math.Max(0, _player.TorchTimeLeft - dt);
			if (_player.TorchTimeLeft <= 0)
			{
				_player.TorchLit = false;
			}
		}

		// 生命降至 0 则结束游戏
		if (_player.Health <= 0)
		{
			_running = false;
		}
	}

	// 昼夜判定：简单比例切分，白天占 70%，夜晚占 30%
	private TimePhase GetPhase()
	{
		// Simple split: 70% day, 30% night
		double ratio = _timeOfDaySeconds / DayLengthSeconds;
		return ratio < 0.7 ? TimePhase.Day : TimePhase.Night;
	}

	// 渲染：绘制地图字符与 HUD 信息
	private void Render()
	{
		Console.SetCursorPosition(0, 0);
		var sb = new StringBuilder();
		for (int y = 0; y < _world.Height; y++)
		{
			for (int x = 0; x < _world.Width; x++)
			{
				char ch = _world.GetGlyphAt(x, y);
				if (x == _player.X && y == _player.Y) ch = '@'; // 玩家位置标记
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

