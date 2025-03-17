* allow specifying dependencies with `golem component new`
* include link to documentation in generated golem.yaml
* make golem.yaml searchable on the website
* do not generate wit-generated folder if I have no dependencies
* app specific name for common wit
* mismatch between dependencies I need to add myself to cargo.toml and ones the tool adds automatically
* what If I want to add these manually? Feels weird:
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
