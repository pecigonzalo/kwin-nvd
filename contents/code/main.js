var state = {
  savedDesktops: {}
};

function log(msg) {
  print("NVD: " + msg);
}

function createDesktop() {
  log("createDesktop: true");
  var next = workspace.desktops + 1;
  workspace.desktops = next;
  return next;
}

function clientsInDesktop(desktop) {
  return workspace.clientList().filter(
    function(client) {
      if (client.desktop == desktop) {
        log("clientsInDesktop " + desktop + ": " + client.caption);
        return client.desktop;
      }
    }
  );
}

function clientsAfterDesktop(desktop) {
  return workspace.clientList().filter(
    function(client) {
      return client.desktop > desktop;
    }
  );
}

function pullClientsAfterDesktop(desktop) {
  clientsAfter = clientsAfterDesktop(desktop);
  if (clientsAfter.length > 0) {
    clientsAfter.forEach(
      function(c) {
        c.desktop--;
      }
    );
  }
}

function pushClientsAfterDesktop(desktop) {
  clientsAfter = clientsAfterDesktop(desktop);
  log("pushClientsAfterDesktop: count: " + clientsAfter.length);
  if (clientsAfter.length > 0) {
    clientsAfter.forEach(
      function(c) {
        log("pushClientsAfterDesktop: " + c.caption);
        if (c.desktop == workspace.desktops) {
          createDesktop();
        }
        c.desktop++;
      }
    );
  }
}

function moveToNewDesktop(client) {
  // Only maximize to new desktop is current desktop is full
  if (clientsInDesktop(client.desktop).length > 1) {
    log("Curent desktop has clients, moving to new desktop");
    // Save window state
    state.savedDesktops[client.windowId] = client.desktop;
    if (client.desktop == workspace.desktops) {
      createDesktop();
    } else {
      pushClientsAfterDesktop(client.desktop);
    }
    client.desktop++;
    workspace.currentDesktop++;
    workspace.activateClient = client;
  }
}

function moveBack(client) {
  var old = client.desktop;
  var saved = this.state.savedDesktops[client.windowId];
  if (saved === undefined) {
    log("Ignoring window not previously seen: " + client.caption);
  } else {
    log("Resotre client desktop to " + saved);
    client.desktop = saved;
    workspace.currentDesktop = saved;
    workspace.activateClient = client;
    if (clientsInDesktop(old).length == 0) {
      log("moveBack: will reduce max desktops");
      pullClientsAfterDesktop(old);
      workspace.desktops--;
    }
  }
}

function clientMaximizeHandle(client, h, v) {
  log("Maximize Handle: " + client.caption + " - " + client.desktop);

  // If desktop is -1, this window is on all desktops and there is nothig to do
  if (client.desktop != -1) {
    if (h && v) {
      log("Maximize Handle: maximize");
      moveToNewDesktop(client);
    } else {
      log("Maximize Handle: unmaximize");
      moveBack(client);
    }
  }
}

function clientUnminimizedHandler(client) {
  log("Unminimize Handle: " + client.caption + " - " + client.desktop);

  // If desktop is -1, this window is on all desktops and there is nothig to do
  if (client.desktop != -1) {
    moveToNewDesktop(client);
  }
}

function clientCloseHandler(client) {
  log("Close Handle: " + client.caption + " - " + client.desktop);

  // If desktop is -1, this window is on all desktops and there is nothig to do
  if (client.desktop != -1) {
    if (clientsInDesktop(client.desktop).length == 1) {
      log("clientCloseHandler: will reduce max desktops");
      pullClientsAfterDesktop(client.desktop);
      workspace.currentDesktop--;
      client.desktop--;
      workspace.desktops--;
    }
  }
}

log("Installing shortcuts");
workspace.clientMaximizeSet.connect(clientMaximizeHandle);
workspace.clientUnminimized.connect(clientUnminimizedHandler);
workspace.clientMinimized.connect(clientCloseHandler);
workspace.clientRemoved.connect(clientCloseHandler);
log("Shortcuts installed");
