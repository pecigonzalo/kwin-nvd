var nvd = {
  state: {
    savedDesktops: {},
    enabled: true
  },
  log: function(msg) {
    print("NVD: " + msg);
  },
  moveToNewDesktop: function(client) {
    this.state.savedDesktops[client.windowId] = client.desktop;

    var next = workspace.desktops + 1;
    workspace.desktops = next;
    client.desktop = next;
    workspace.currentDesktop = next;
    workspace.activateClient = client;
  },
  moveBack: function(client) {
    var saved = this.state.savedDesktops[client.windowId];
    if (saved === undefined) {
      this.log("Ignoring window not previously seen: " + client.caption);
    } else {
      this.log("Resotre client desktop to " + saved);
      client.desktop = saved;
      workspace.currentDesktop = saved;
      workspace.activateClient = client;

      workspace.desktops -= 1;
    }
  },
  fullHandler: function(client, full, user) {
    if (full) {
      nvd.moveToNewDesktop(client);
    } else {
      nvd.moveBack(client);
    }
  },
  install: function() {
    workspace.clientMaximizeSet.connect(this.fullHandler);
    // registerShortcut(
    //   "Maximize to new VirtualDesktop",
    //   "Maximize to new VirtualDesktop",
    //   "Shift+F12",
    //   function() {
    //     fullHandler();
    //   }
    // );
    this.log("Shortcut installed");
  }
}

nvd.log("Installing shortcut");
nvd.install();
