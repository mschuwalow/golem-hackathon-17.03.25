mod bindings;

use bindings::chatroom::common::types::RoomMessage;

use crate::bindings::exports::chatroom::inbox_exports::chatroom_inbox_api::*;
// Import for using common lib:
// use common_lib::example_common_function;
use std::sync::{LazyLock, Mutex};

/// This is one of any number of data types that our application
/// uses. Golem will take care to persist all application state,
/// whether that state is local to a function being executed or
/// global across the entire program.
struct State {
    message_buffer: Vec<RoomMessage>,
}

impl Default for State {
    fn default() -> Self {
        Self {
            message_buffer: Vec::new(),
        }
    }
}

static STATE: LazyLock<Mutex<State>> = LazyLock::new(|| Mutex::new(State::default()));

struct Component;

impl Guest for Component {
    fn receive_message(msg: RoomMessage) {
        let mut state = STATE.lock().unwrap();
        state.message_buffer.push(msg);
    }

    fn poll_messages(after: u64, batch_size: u8) -> Vec<MessageWithId> {
        let state = STATE.lock().unwrap();
        let start_index = usize::try_from(after).unwrap();
        let end_index = (start_index + usize::from(batch_size)).min(state.message_buffer.len().saturating_sub(1));
        state.message_buffer[start_index..end_index]
            .iter()
            .enumerate()
            .map(|(i, msg)| MessageWithId {
                id: (start_index + i) as u64,
                message: msg.clone(),
            })
            .collect()
    }
}

bindings::export!(Component with_types_in bindings);
