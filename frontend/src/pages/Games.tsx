import { useNavigate } from "react-router-dom";

interface GameCard {
  title: string;
  description: string;
  route?: string;
  comingSoon?: boolean;
}

const games: GameCard[] = [
  {
    title: "2048",
    description:
      "Merge tiles by sliding them with the arrow keys. Reach the 2048 tile to win!",
    route: "/games/2048",
  },
  {
    title: "Guess the Colour",
    description:
      "You're shown a colour for 6 seconds. Adjust 3 sliders to recreate it from memory!",
    route: "/games/colourguesser"
  },
  {
    title: "Blackjack",
    description:
      "Classic game of blackjack",
    comingSoon: true,
  },
];

const Games = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Games</h1>
      <p className="text-sm text-gray-500 mb-8">Pick a game to play</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div
            key={game.title}
            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-3"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {game.title}
            </h2>
            <p className="text-sm text-gray-500 flex-1">{game.description}</p>
            {game.comingSoon ? (
              <span className="text-xs text-gray-400 italic">Coming soon</span>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => navigate(game.route!)}
                  className="mt-2 w-[100px] py-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Play
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;
