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
  log("clientsInDesktop " + desktop);
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
  log("clientsAfterDesktop " + desktop);
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
        state.savedDesktops[c.windowId] = c.desktop;
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
        if (c.desktop == workspace.desktops) {
          createDesktop();
        }
        c.desktop++;
        state.savedDesktops[c.windowId] = c.desktop;
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

function shouldSkip(client) {
  // Detect clients that should not action
  if (client.skipTaskbar || client.modal || client.transient) {
    log("clientCloseHandler: skip temp client")
    return true;
  } else {
    return false;
  }
}

function clientMaximizeHandler(client, h, v) {
  log("clientMaximizeHandler: " + client.caption + " - " + client.desktop);
  if (shouldSkip) {
    return;
  }
  // If desktop is -1, this window is on all desktops and there is nothig to do
  if (client.desktop != -1) {
    if (h && v) {
      log("clientMaximizeHandler: maximize");
      moveToNewDesktop(client);
    } else {
      log("clientMaximizeHandler: unmaximize");
      moveBack(client);
    }
  }
}

function clientCloseHandler(client) {
  log("clientCloseHandler: " + client.caption + " - " + client.desktop);
  if (shouldSkip) {
    return;
  }
  moveBack(client);
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
