var LOCK = false

function log(msg) {
  print("NVD: " + msg);
}

function createDesktop() {
  log("createDesktop: true");
  workspace.desktops = workspace.desktops + 1;
  return workspace.desktops;
}

function clientsInDesktop(desktop) {
  log("clientsInDesktop " + desktop);
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
  log("clientsAfterDesktop " + desktop);
  return workspace.clientList().filter(
    function(client) {
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
    if (clientsInDesktop(client.desktop).length <= 1) {
        log("Resotre client desktop to left of: " + client.desktop);
        workspace.currentDesktop--;
        client.desktop = workspace.currentDesktop;
        workspace.activateClient = client;
        pullClientsAfterDesktop(client.desktop);
        workspace.desktops--;
    }
}

function clientMaximizeHandler(client, h, v) {
  log("clientMaximizeHandler: " + client.caption + " - " + client.desktop);

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

function clientUnminimizedHandler(client) {
  log("clientUnminimizedHandler: " + client.caption + " - " + client.desktop);

  // If desktop is -1, this window is on all desktops and there is nothig to do
  if (client.desktop != -1) {
    moveToNewDesktop(client);
  }
}

function clientCloseHandler(client) {
    log("clientCloseHandler: " + client.caption + " - " + client.desktop);
    if (client.skipTaskbar || client.modal || client.transient){
      log("clientCloseHandler: skip temp client")
      return;
    }
    //moveBack(client);
    workspace.currentDesktop--;
    var test2 = client.desktop - 1
    log("should move client to: " + test2)
    // client.desktop = test2
    var test = workspace.desktops - 1
    log("should set: " + test)
    workspace.desktops = workspace.desktops - 1

}

function clientMinimizedHandler(client) {
  log("clientMinimizedHandler: " + client.caption + " - " + client.desktop);
  moveBack(client);
}

log("Installing shortcuts");
workspace.clientMaximizeSet.connect(clientMaximizeHandler);
// workspace.clientUnminimized.connect(clientUnminimizedHandler);
// workspace.clientMinimized.connect(clientMinimizedHandler);
workspace.clientRemoved.connect(clientCloseHandler);
log("Shortcuts installed");
