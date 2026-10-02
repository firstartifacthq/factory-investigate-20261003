{ pkgs, ... }: {
  languages.javascript = { enable = true; package = pkgs.nodejs_24; };
  packages = [ pkgs.git ];
  processes.server = {
    exec = "node server.mjs";
    ready.http.get = { port = 3000; path = "/health"; };
    restart.on = "never";
  };
}
