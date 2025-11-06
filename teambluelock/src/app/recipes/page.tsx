import { Button } from "@/components/ui/button"

type Recipe = {
  id: number;
  name: string;
  shortDescription: string;
};

const recipes: Recipe[] = [
  {
    id: 1,
    name: "Classic Iced Coffee",
    shortDescription: "A refreshing summer drink made with chilled brewed coffee, milk, and ice.",
  },
  {
    id: 2,
    name: "Creamy Alfredo Pasta",
    shortDescription: "A rich and comforting Italian pasta dish made with butter, cream, and Parmesan.",
  },
  {
    id: 3,
    name: "Grilled Chicken Tacos",
    shortDescription: "Juicy grilled chicken wrapped in warm tortillas with fresh toppings.",
  },
  {
    id: 4,
    name: "Vegetable Stir-Fry",
    shortDescription: "A colorful mix of veggies cooked in a savory soy and ginger sauce.",
  },
  {
    id: 5,
    name: "Chocolate Chip Cookies",
    shortDescription: "Soft, chewy cookies loaded with melty chocolate chips.",
  },
  {
    id: 6,
    name: "Caprese Salad",
    shortDescription: "A fresh Italian salad with tomatoes, mozzarella, and basil.",
  },
];

export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl text-sky-600 font-semibold">Recipes</h2>
        <p className="mt-2 text-white-600 text-sm">
          These are example “recipes” for views/reports you might build in your
          small business dashboard. Click a box to see more details. All of this
          is placeholder text for now.
        </p>
      </header>

      <div>
        <Button>Add New Recipe</Button>
      </div>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recipes.map((recipe) => (
          <details
            key={recipe.id}
            className="group rounded-xl border bg-sky-600 shadow-sm open:shadow-md transition-shadow"
          >
            <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {recipe.name}
                  </h3>
                  <p className="mt-1 text-xs text-white-500">
                    {recipe.shortDescription}
                  </p>
                </div>
                {/* <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {recipe.category}
                </span> */}
              </div>

              {/* <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700"
                  >
                    {tag}
                  </span>
                ))}
              </div> */}
            </summary>
          </details>
        ))}
      </section>
    </div>
  );
}
