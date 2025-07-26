/**
 * @file Zap grammar for tree-sitter
 * @author Filip Tibell
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "zap",

  word: ($) => $.identifier,
  conflicts: ($) => [[$.namespaced_type, $.type]],
  extras: ($) => [/\s/, $.doc_comment, $.comment],

  rules: {
    source_file: ($) => repeat($._definition),

    _definition: ($) =>
      choice(
        $.namespace_declaration,
        $.option_declaration,
        $.type_declaration,
        $.event_declaration,
        $.function_declaration,
        $.identifier,
      ),

    // Comments

    doc_comment: ($) => token(seq("---", /.*/)),
    comment: ($) => token(seq("--", /.*/)),

    // Identifiers

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Other values

    string: () => token(/"[^"]*"/),
    number: () => /\d+/,
    boolean: () => choice("true", "false"),
    property: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $.type),
        optional(","),
      ),

    // Types

    type: ($) =>
      seq(
        choice(
          $.namespaced_type,
          $.optional_type,
          $.primitive_type,
          $.struct_type,
          $.enum_type,
          $.set_type,
          $.map_type,
          $.identifier,
          seq($.primitive_type, ".", $.primitive_spec),
          seq($.primitive_type, "(", $.primitive_spec, ")"),
        ),
        optional($.range),
        optional($.array),
      ),

    namespaced_type: ($) =>
      seq(
        repeat(seq(field("namespace", $.identifier), ".")),
        field("type", $.identifier),
      ),

    optional_type: ($) => seq(field("type", $.type), "?"),

    primitive_type: ($) =>
      choice(
        "string",
        "boolean",
        "f64",
        "f32",
        "u8",
        "u16",
        "u32",
        "i8",
        "i16",
        "i32",
        "CFrame",
        "AlignedCFrame",
        "Vector3",
        "Vector2",
        "DateTime",
        "DateTimeMillis",
        "Color3",
        "BrickColor",
        "Instance",
      ),
    primitive_spec: ($) => $.identifier,

    // Tuples

    tuple: ($) => seq("(", repeat(seq($.tuple_value, optional(","))), ")"),
    tuple_value: ($) => choice($._tuple_value_named, $._tuple_value_unnamed),
    _tuple_value_named: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),
    _tuple_value_unnamed: ($) => field("type", $.type),

    // Modifiers: Ranges / Arrays

    range: ($) => choice($.range_empty, $.range_exact, $.range_inexact),
    range_empty: () => seq("(", ")"),
    range_exact: ($) => seq("(", $.number, ")"),
    range_inexact: ($) =>
      seq("(", optional($.number), "..", optional($.number), ")"),

    array: ($) => choice($.array_empty, $.array_exact, $.array_inexact),
    array_empty: () => seq("[", "]"),
    array_exact: ($) => seq("[", $.number, "]"),
    array_inexact: ($) =>
      seq("[", optional($.number), "..", optional($.number), "]"),

    // Collections: Structs / Enums / Maps / Sets

    struct_type: ($) =>
      seq("struct", field("properties", seq("{", repeat($.property), "}"))),

    enum_type: ($) =>
      seq(
        "enum",
        optional(field("tag", $.string)),
        "{",
        repeat(seq($.enum_variant, optional(","))),
        "}",
      ),
    enum_variant: ($) =>
      seq(
        $.identifier,
        optional(field("properties", seq("{", repeat($.property), "}"))),
      ),

    map_type: ($) =>
      seq(
        "map",
        "{",
        "[",
        field("key_type", $.type),
        "]",
        ":",
        field("value_type", $.type),
        "}",
      ),

    set_type: ($) => seq("set", "{", field("type", $.type), "}"),

    // Declarations: Namespaces

    namespace_declaration: ($) =>
      seq(
        "namespace",
        field("name", $.identifier),
        "=",
        "{",
        repeat($._definition),
        "}",
      ),

    // Declarations: Events

    event_declaration: ($) =>
      seq(
        "event",
        field("name", $.identifier),
        "=",
        "{",
        repeat(
          choice(
            $.event_from_field,
            $.event_type_field,
            $.event_call_field,
            $.event_data_field,
            $.property,
          ),
        ),
        "}",
      ),

    event_from_field: ($) =>
      seq(
        "from",
        ":",
        field("value", choice($.event_from_value, $.identifier)),
        optional(","),
      ),
    event_from_value: () => choice("Server", "Client"),

    event_type_field: ($) =>
      seq(
        "type",
        ":",
        field("value", choice($.event_type_value, $.identifier)),
        optional(","),
      ),
    event_type_value: () => choice("Reliable", "Unreliable"),

    event_call_field: ($) =>
      seq(
        "call",
        ":",
        field("value", choice($.event_call_value, $.identifier)),
        optional(","),
      ),
    event_call_value: () =>
      choice("ManyAsync", "ManySync", "SingleAsync", "SingleSync", "Polling"),

    event_data_field: ($) =>
      seq("data", ":", choice($.tuple, $.type), optional(",")),

    // Declarations: Functions

    function_declaration: ($) =>
      seq(
        "funct",
        field("name", $.identifier),
        "=",
        "{",
        repeat(
          choice(
            $.function_call_field,
            $.function_args_field,
            $.function_rets_field,
            $.property,
          ),
        ),
        "}",
      ),

    function_call_field: ($) =>
      seq(
        "call",
        ":",
        field("value", choice($.function_call_value, $.identifier)),
        optional(","),
      ),
    function_call_value: () => choice("Async", "Sync"),

    function_args_field: ($) =>
      seq("args", ":", choice($.tuple, $.type), optional(",")),

    function_rets_field: ($) =>
      seq("rets", ":", choice($.tuple, $.type), optional(",")),

    // Declarations: Options / Types

    option_declaration: ($) =>
      seq(
        "opt",
        $.identifier,
        "=",
        choice($.string, $.number, $.boolean, $.identifier),
      ),

    type_declaration: ($) =>
      seq("type", field("name", $.identifier), "=", field("value", $.type)),
  },
});
