var state = {
  savedDesktops: {},
  enabled: true
};

function log(msg) {
  print("NVD: " + msg);
}

function createDesktop() {
  log("createDesktop: true");
  workspace.desktops++;
  return workspace.desktops;
}

function clientsInDesktop(desktop) {
  log("clientsInDesktop " + desktop + " list");
  return workspace.clientList().filter(
    function (client) {
      if (client.desktop == desktop) {
        log("clientsInDesktop " + desktop + ": " + client.caption);
        return client.desktop;
      }
    }
  );
}

function clientsAfterDesktop(desktop) {
  log("clientsAfterDesktop " + desktop + " list");
  return workspace.clientList().filter(
    function (client) {
      if (client.desktop > desktop) {
        log("clientsAfterDesktop " + desktop + ": " + client.caption);
        return client.desktop;
      }
    }
  );
}

function pullClientsAfterDesktop(desktop) {
  clientsAfter = clientsAfterDesktop(desktop);
  if (clientsAfter.length > 0) {
    clientsAfter.forEach(
      function (c) {
        c.desktop--;
        // If we know the window, save its new state
        if (c.windowId in state.savedDesktops) {
          state.savedDesktops[c.windowId] = c.desktop;
        }
      }
    );
  }
}

function pushClientsAfterDesktop(desktop) {
  clientsAfter = clientsAfterDesktop(desktop);
  log("pushClientsAfterDesktop: count: " + clientsAfter.length);
  if (clientsAfter.length > 0) {
    clientsAfter.forEach(
      function (c) {
        log("pushClientsAfterDesktop: " + c.caption);
        // Commented to prevent eating user desktops, always create new ones. TODO: Create a setting for it
        // if (c.desktop == workspace.desktops) {
        //   createDesktop();
        // }
        c.desktop++;
        // If we know the window, save its new state
        if (c.windowId in state.savedDesktops) {
          state.savedDesktops[c.windowId] = c.desktop;
        }
      }
    );
  }
}

function moveToNewDesktop(client) {
  // Only maximize to new desktop is current desktop is full
  if (clientsInDesktop(client.desktop).length > 1) {
    log("Curent desktop has clients, moving to new desktop");
    state.savedDesktops[client.windowId] = client.desktop;
    if (client.desktop == workspace.desktops) {
      createDesktop();
    } else {
      createDesktop();
      pushClientsAfterDesktop(client.desktop);
    }
    workspace.currentDesktop++;
    client.desktop = workspace.currentDesktop;
    workspace.activateClient = client;
  }
}

function moveBack(client) {
  if (clientsInDesktop(client.desktop).length == 1) {
    var saved = state.savedDesktops[client.windowId];
    if (saved === undefined) {
      log("Ignoring window not previously seen: " + client.caption);
    } else {
      var current = client.desktop;
      log("Resotre client to desktop: " + saved);
      client.desktop = saved;
      workspace.currentDesktop = saved;
      workspace.activateClient = client;
      pullClientsAfterDesktop(client.desktop);
      workspace.desktops--;
    }
  }
}

function shouldSkip(client, desktop) {
  // If desktop is -1, this window is on all desktops and there is nothig to do
  if (desktop == -1) {
    log("Client: '" + client.caption + "' will skip handle, no desktop");
    return true;
  }

  // Detect clients that should not action
  if (client.skipTaskbar || client.modal || client.transient) {
    log("Client: '" + client.caption + "' will skip handle");
    return true;
  }

  log("Client: '" + client.caption + "' will be handled");
  return false;
}

function clientMaximizeHandler(client, h, v) {
  log("clientMaximizeHandler: " + client.caption + " - " + client.desktop);
  if (shouldSkip(client, client.desktop)) {
    return;
  }

  if (h && v) {
    log("clientMaximizeHandler: maximize");
    moveToNewDesktop(client);
  } else {
    log("clientMaximizeHandler: unmaximize");
    moveBack(client);
    delete state.savedDesktops[client.windowId]; // Remove IDs after we have returned the window
  }
}

function clientCloseHandler(client) {
  var cd = client.desktop;
  var cc = client.caption;
  var id = client.windowId;
  log("clientCloseHandler: " + cc + " - Desktop: " + cd);

  // Prevent removing desktop if we close any non maximized window/known
  if (!(id in state.savedDesktops)) {
    log("Not a known window, skipping")
    return;
  }

  if (shouldSkip(client, cd)) {
    return;
  }

  pullClientsAfterDesktop(cd);
  workspace.desktops--;
  delete state.savedDesktops[id];
}

function install() {
  workspace.clientMaximizeSet.connect(clientMaximizeHandler);
  workspace.clientRemoved.connect(clientCloseHandler);
  log("Handler installed");
}

function uninstall() {
  workspace.clientMaximizeSet.disconnect(clientMaximizeHandler);
  workspace.clientRemoved.disconnect(clientCloseHandler);
  log("Handler cleared");
}

registerUserActionsMenu(function (client) {
  return {
    text: "Maximize to New Desktop",
    items: [{
      text: "Enabled",
      checkable: true,
      checked: state.enabled,
      triggered: function () {
        state.enabled = !state.enabled;
        if (state.enabled) {
          install();
        } else {
          uninstall();
        }
      }
    }, ]
  };
});

install();
