mod bindings;

// Import for using common lib:
// use common_lib::example_common_function;
use bindings::chatroom::inbox_client::chatroom_inbox_client::ChatroomInboxApi;
use bindings::golem::api::host::{self, resolve_component_id, worker_uri, WorkerId};
use crate::bindings::exports::chatroom::room_exports::chatroom_room_api::*;
use std::borrow::BorrowMut;
use std::cell::RefCell;
use std::collections::HashSet;
use std::sync::{LazyLock, Mutex};

/// This is one of any number of data types that our application
/// uses. Golem will take care to persist all application state,
/// whether that state is local to a function being executed or
/// global across the entire program.
struct State {
    connected_clients: HashSet<String>,
}

impl Default for State {
    fn default() -> Self {
        Self {
            connected_clients: HashSet::new()
        }
    }
}

static STATE: LazyLock<Mutex<State>> = LazyLock::new(|| Mutex::new(State::default()));

struct Component;

impl Guest for Component {
    fn join(client_worker_name: String) {
        let mut state = STATE.lock().unwrap();
        state.connected_clients.insert(client_worker_name);
    }

    fn leave(client_worker_name: String) {
        let mut state = STATE.lock().unwrap();
        state.connected_clients.remove(&client_worker_name);
    }

    fn send(current_client_worker_name: String, msg: Message) {
        let state = STATE.lock().unwrap();

        let client_component_id = resolve_component_id("chatroom:inbox").unwrap();

        for client_worker_name in state.connected_clients.iter() {
            if *client_worker_name != current_client_worker_name {
                let client_uri = worker_uri(&WorkerId {
                    component_id: client_component_id.clone(),
                    worker_name: client_worker_name.clone()
                });
                let client_api = ChatroomInboxApi::new(&client_uri);
                println!("Fowarding message to {client_worker_name}");
                client_api.receive_message(&msg);
            }
        }
    }
}

bindings::export!(Component with_types_in bindings);
