import "./style.css";
import { initApp } from "./app/index.js";

const root = document.querySelector<HTMLDivElement>("#app")!;
initApp(root);
