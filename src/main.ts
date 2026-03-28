import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-indigo-600 mb-4">Harmonia Trainer</h1>
      <p class="text-gray-600 text-lg">Your harmony singing practice companion</p>
    </div>
  </div>
`;
