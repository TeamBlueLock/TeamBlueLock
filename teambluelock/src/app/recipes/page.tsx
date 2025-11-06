import { Button } from "@/components/ui/button"

type Recipe = {
  id: number;
  name: string;
  shortDescription: string;
  longDescription: string;
};

const recipes: Recipe[] = [
  {
    id: 1,
    name: "Classic Iced Coffee",
    shortDescription: "A refreshing summer drink made with chilled brewed coffee, milk, and ice.",
    longDescription:
      "Brew a strong cup of coffee and let it cool completely. Fill a glass with ice cubes, pour in the coffee, and add milk or cream to taste. Sweeten with sugar or vanilla syrup if desired. Stir well and enjoy a perfect balance of smooth and bold flavor.",
  },
  {
    id: 2,
    name: "Creamy Alfredo Pasta",
    shortDescription: "A rich and comforting Italian pasta dish made with butter, cream, and Parmesan.",
    longDescription:
      "Cook fettuccine or your favorite pasta until al dente. In a pan, melt butter, add minced garlic, and stir in heavy cream. Simmer gently, then mix in grated Parmesan cheese until creamy. Toss the pasta in the sauce and finish with black pepper and parsley.",
  },
  {
    id: 3,
    name: "Grilled Chicken Tacos",
    shortDescription: "Juicy grilled chicken wrapped in warm tortillas with fresh toppings.",
    longDescription:
      "Marinate chicken in lime juice, olive oil, garlic, and spices. Grill until golden brown, then slice thinly. Serve in tortillas with lettuce, pico de gallo, and a drizzle of sour cream or avocado sauce. Great for quick dinners or weekend gatherings.",
  },
  {
    id: 4,
    name: "Vegetable Stir-Fry",
    shortDescription: "A colorful mix of veggies cooked in a savory soy and ginger sauce.",
    longDescription:
      "Heat oil in a wok or skillet. Add chopped vegetables like bell peppers, carrots, and broccoli. Stir-fry quickly over high heat, then pour in a mix of soy sauce, garlic, ginger, and sesame oil. Serve hot with steamed rice or noodles.",
  },
  {
    id: 5,
    name: "Chocolate Chip Cookies",
    shortDescription: "Soft, chewy cookies loaded with melty chocolate chips.",
    longDescription:
      "Cream together butter and brown sugar until fluffy. Add eggs and vanilla, then stir in flour, baking soda, and salt. Fold in chocolate chips. Scoop dough onto a baking sheet and bake until golden brown around the edges. Let cool before serving.",
  },
  {
    id: 6,
    name: "Caprese Salad",
    shortDescription: "A fresh Italian salad with tomatoes, mozzarella, and basil.",
    longDescription:
      "Slice ripe tomatoes and fresh mozzarella cheese. Layer them alternately on a plate with basil leaves. Drizzle with olive oil and balsamic glaze, then sprinkle with salt and pepper. Light, elegant, and ready in minutes.",
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

            <div className="border-t px-5 py-4 text-sm text-slate-700">
              <p className="mb-2">{recipe.longDescription}</p>
              <p className="text-xs text-slate-500">
                Details are just placeholders for now — later you can connect
                each recipe to real MongoDB queries, charts, or pages.
              </p>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
