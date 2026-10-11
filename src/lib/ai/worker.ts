// Web worker that hosts the WebLLM engine. Running the engine here keeps heavy
// inference off the main thread, so the UI stays responsive while the local
// model thinks. All computation happens on this device - nothing is uploaded.
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (event: MessageEvent) => {
  handler.onmessage(event);
};
