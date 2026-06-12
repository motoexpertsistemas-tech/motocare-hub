// vite.config.ts
import { defineConfig } from "file:///C:/Users/wesdr/Downloads/motocare-hub-main/motocare-hub-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/wesdr/Downloads/motocare-hub-main/motocare-hub-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/wesdr/Downloads/motocare-hub-main/motocare-hub-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\wesdr\\Downloads\\motocare-hub-main\\motocare-hub-main";
var BUILD_ID = process.env.VITE_APP_BUILD_ID ?? (/* @__PURE__ */ new Date()).toISOString();
var versionJsonPlugin = () => ({
  name: "emit-version-json",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split("?")[0] !== "/version.json") return next();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.end(JSON.stringify({ buildId: BUILD_ID }));
    });
  },
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify({ buildId: BUILD_ID })
    });
  }
});
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    versionJsonPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"]
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"]
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID)
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx3ZXNkclxcXFxEb3dubG9hZHNcXFxcbW90b2NhcmUtaHViLW1haW5cXFxcbW90b2NhcmUtaHViLW1haW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHdlc2RyXFxcXERvd25sb2Fkc1xcXFxtb3RvY2FyZS1odWItbWFpblxcXFxtb3RvY2FyZS1odWItbWFpblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvd2VzZHIvRG93bmxvYWRzL21vdG9jYXJlLWh1Yi1tYWluL21vdG9jYXJlLWh1Yi1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFBsdWdpbiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuXG5jb25zdCBCVUlMRF9JRCA9IHByb2Nlc3MuZW52LlZJVEVfQVBQX0JVSUxEX0lEID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuLy8gRW1pdGUvc2VydmUgL3ZlcnNpb24uanNvbiBwYXJhIHZlcmlmaWNhXHUwMEU3XHUwMEUzbyBkZSB2ZXJzXHUwMEUzbyBubyBjbGllbnRcbmNvbnN0IHZlcnNpb25Kc29uUGx1Z2luID0gKCk6IFBsdWdpbiA9PiAoe1xuICBuYW1lOiBcImVtaXQtdmVyc2lvbi1qc29uXCIsXG4gIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgaWYgKHJlcS51cmw/LnNwbGl0KFwiP1wiKVswXSAhPT0gXCIvdmVyc2lvbi5qc29uXCIpIHJldHVybiBuZXh0KCk7XG5cbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgcmVzLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJuby1zdG9yZSwgbm8tY2FjaGUsIG11c3QtcmV2YWxpZGF0ZSwgcHJveHktcmV2YWxpZGF0ZVwiKTtcbiAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBidWlsZElkOiBCVUlMRF9JRCB9KSk7XG4gICAgfSk7XG4gIH0sXG4gIGdlbmVyYXRlQnVuZGxlKCkge1xuICAgIHRoaXMuZW1pdEZpbGUoe1xuICAgICAgdHlwZTogXCJhc3NldFwiLFxuICAgICAgZmlsZU5hbWU6IFwidmVyc2lvbi5qc29uXCIsXG4gICAgICBzb3VyY2U6IEpTT04uc3RyaW5naWZ5KHsgYnVpbGRJZDogQlVJTERfSUQgfSksXG4gICAgfSk7XG4gIH0sXG59KTtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2UsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIHZlcnNpb25Kc29uUGx1Z2luKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0L2pzeC1ydW50aW1lXCJdLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiXSxcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgX19BUFBfQlVJTERfSURfXzogSlNPTi5zdHJpbmdpZnkoQlVJTERfSUQpLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrWCxTQUFTLG9CQUFpQztBQUM1WixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBS3pDLElBQU0sV0FBVyxRQUFRLElBQUksc0JBQXFCLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBR3pFLElBQU0sb0JBQW9CLE9BQWU7QUFBQSxFQUN2QyxNQUFNO0FBQUEsRUFDTixnQkFBZ0IsUUFBUTtBQUN0QixXQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLFVBQUksSUFBSSxLQUFLLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxnQkFBaUIsUUFBTyxLQUFLO0FBRTVELFVBQUksVUFBVSxnQkFBZ0Isa0JBQWtCO0FBQ2hELFVBQUksVUFBVSxpQkFBaUIsdURBQXVEO0FBQ3RGLFVBQUksSUFBSSxLQUFLLFVBQVUsRUFBRSxTQUFTLFNBQVMsQ0FBQyxDQUFDO0FBQUEsSUFDL0MsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLGlCQUFpQjtBQUNmLFNBQUssU0FBUztBQUFBLE1BQ1osTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsUUFBUSxLQUFLLFVBQVUsRUFBRSxTQUFTLFNBQVMsQ0FBQztBQUFBLElBQzlDLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUMsa0JBQWtCO0FBQUEsRUFDcEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxJQUNBLFFBQVEsQ0FBQyxTQUFTLGFBQWEsbUJBQW1CO0FBQUEsRUFDcEQ7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxTQUFTLGFBQWEsdUJBQXVCO0FBQUEsRUFDekQ7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLGtCQUFrQixLQUFLLFVBQVUsUUFBUTtBQUFBLEVBQzNDO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
