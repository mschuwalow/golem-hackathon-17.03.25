* allow specifying dependencies with `golem component new`
* include link to documentation in generated golem.yaml
* make golem.yaml searchable on the website
* do not generate wit-generated folder if I have no dependencies
* app specific name for common wit
* mismatch between dependencies I need to add myself to cargo.toml and ones the tool adds automatically
  what If I want to add these manually? Feels weird:
```
"wasi:io" = { path = "wit-generated/deps/io" }
"wasi:clocks" = { path = "wit-generated/deps/clocks" }
"golem:rpc" = { path = "wit-generated/deps/wasm-rpc" }
```
* confusing: how to add common deps?
* wit-deps does not include wit/common.wit
* golem-rust types mismatch:
|                                  ---------------------- ^^^^^^^^^^^ expected `bindings::golem::rpc::types::Uri`, found `golem_rust::bindings::golem::rpc::types::Uri`
* we need some kind of worker-local database (rocksdb, sqlite, ...)
* worker_uri and friends should be associated methods on generated clients
* component id in the gateway binding
* no component id in `golem app deploy`. Needed for api definition
* no way of getting component_id at all
* no quick command to check golem-cli version
* bad api definition errors:
```
error: API Definition Service - Error: 400 Bad Request, Parse error at line: 2, column: 10
Unexpected `r`
Unexpected `o`
Expected bool, s8, u8, s16, u16, s32, u32, s64, u64, f32, f64, char, string, list, tuple, option, whitespaces or result
```
for definition
```
id: chatroom-v1
draft: true
version: 0.0.4
routes:
  - method: Post
    path: "/v1/rooms/{room-name}/join"
    binding:
      type: wit-worker
      componentId:
        componentId: "e34fb6b8-4e6d-4cea-915e-ceb93e7e1d5e"
        version: 0
      worker-name: |
        request.path.room-name
      response: |
        let user: string = request.body.user_id;
        chatroom:room-exports/chatroom-room-api.{{join}}(user);
        {status: 200}

```
* rib type inference errors are not helpful:
```
error: API Definition Service - Error: 500 Internal Server Error, Rib internal error: failed to convert inferred type to analysed type: Cannot convert AllOf types (multiple types) to AnalysedType. [Record([("body", Record([("user_id", Str)]))]), Record([("path", Record([("room-name", Str)]))]), Record([("path", Record([("room-name", Unknown)]))]), Record([("path", AllOf([Record([("room-name", Str)]), Record([("room-name", Unknown)])]))])]
```
for
```
id: chatroom-v1
draft: true
version: 0.0.4
routes:
  - method: Post
    path: "/v1/rooms/{room-name}/join"
    binding:
      type: wit-worker
      componentId:
        componentId: "e34fb6b8-4e6d-4cea-915e-ceb93e7e1d5e"
        version: 0
      # worker-name: |
      #   request.path.room-name
      response: |
        let user: string = request.body.user_id;
        let worker = instance(request.path.room-name);
        worker.join(user);
        {status: 200}

```
* draft mechanism is confusing and undocumented
* query parameter bindings are undocumented
* direct worker invocation in rib (?) is undocumented
* rib fails during runtime when it should fail during typechecking:
```
HTTP/1.1 400 Bad Request
content-length: 463
date: Tue, 18 Mar 2025 13:23:41 GMT

Invalid input: Input request doesn't match the requirements for rib expression to execute: Key 'query' not found in json_map. Requirements. Record(TypeRecord { fields: [NameTypePair { name: "path", typ: Record(TypeRecord { fields: [NameTypePair { name: "user-id", typ: Str(TypeStr) }] }) }, NameTypePair { name: "query", typ: Record(TypeRecord { fields: [NameTypePair { name: "after", typ: U64(TypeU64) }, NameTypePair { name: "limit", typ: U8(TypeU8) }] }) }] })
```
```
  - method: Get
    path: "/v1/inboxes/{user-id}/messages?{after}&{limit}"
    binding:
      type: wit-worker
      componentId:
        componentId: "161ee401-13e5-4198-98d0-491ff6f5903d"
        version: 0
      response: |
        let user-id: string = request.path.user-id;
        let worker = instance(user-id);
        let after: u64 = request.query.after;
        let limit: u8 = request.query.limit;
        let response = worker.poll-messages(after, limit);
        {status: 200, messages: response}
```
* query and path sharing an namespace in rib is very confusing https://github.com/golemcloud/golem/blob/main/golem-worker-service-base/src/gateway_execution/request.rs#L134
* updating a worker worker after revert leaves it in a broken state:
```
Updating existing workers using auto mode
  Updating all workers (1) for component chatroom:inbox to version 2
    Triggering update for worker chatroom:inbox/abc to version 2 using auto update mode
    Failed to trigger update for worker, error:
      Worker Service - Error: 500 Internal Server Error, Invalid request: The same update is already in progress
```
```
❯ golem worker list
+----------------+-------------+-----------+--------+-----------------------------+
| Component name | Worker name | Component | Status | Created at                  |
|                |             | version   |        |                             |
+----------------+-------------+-----------+--------+-----------------------------+
| chatroom:inbox | abc         |         0 |   Idle | 2025-03-18 13:27:44.302 UTC |
+----------------+-------------+-----------+--------+-----------------------------+
| chatroom:room  | room        |         2 |   Idle | 2025-03-18 13:07:41.380 UTC |
+----------------+-------------+-----------+--------+-----------------------------+
```
* unhelpful error messages when returning data from rib:
```
HTTP/1.1 400 Bad Request
content-length: 425
date: Tue, 18 Mar 2025 13:34:59 GMT

Failed to map input type Record(TypeRecord { fields: [NameTypePair { name: "messages", typ: List(TypeList { inner: Record(TypeRecord { fields: [NameTypePair { name: "id", typ: U64(TypeU64) }, NameTypePair { name: "payload", typ: Record(TypeRecord { fields: [NameTypePair { name: "body", typ: Str(TypeStr) }] }) }] }) }) }, NameTypePair { name: "status", typ: U64(TypeU64) }] }) to any of the expected content types: "\"*/*\""
```
* response content types in rib are undocumented
* cannot reuse wit types from the component definition in rib script
* restore failed after updating component and adding a println!:
```
2025-03-18T13:46:05.573910Z ERROR api_request{api="invoke_and_await_worker_typed" api_type="grpc" worker_id="e34fb6b8-4e6d-4cea-915e-ceb93e7e1d5e/room" account_id="-1"}:waiting-for-permits{worker_id="e34fb6b8-4e6d-4cea-915e-ceb93e7e1d5e/room"}:invocation-loop{worker_id="e34fb6b8-4e6d-4cea-915e-ceb93e7e1d5e/room"}:invocation{worker_id=e34fb6b8-4e6d-4cea-915e-ceb93e7e1d5e/room}:replaying{function="chatroom:room-exports/chatroom-room-api.{send}"}: golem_worker_executor_base::durable_host::durability: Unexpected imported function call entry in oplog: expected cli::preopens::get_directories, got golem_environment::get_arguments
```
* response mapping requires accept even with no body
```
Failed to map input type Record(TypeRecord { fields: [NameTypePair { name: "status", typ: U64(TypeU64) }] }) to any of the expected content types: "\"*/*\""
```
* number in api path parameter cannot be coerced to string
