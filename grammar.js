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

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => repeat($._definition),

    _definition: ($) =>
      choice(
        $.option_declaration,
        $.type_declaration,
        $.event_declaration,
        $.function_declaration,
        $.identifier,
      ),

    // Comments
    comment: ($) => token(seq("--", /.*/)),

    // Identifiers
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Options
    option_declaration: ($) =>
      seq(
        "opt",
        alias(
          choice(
            "server_output",
            "client_output",
            "types_output",
            "remote_scope",
            "remote_folder",
            "casing",
            "write_checks",
            "typescript",
            "manual_event_loop",
            "typescript_max_tuple_length",
            "yield_type",
            "async_lib",
            "tooling",
            "tooling_output",
            "tooling_show_internal_data",
            "disable_fire_all",
          ),
          $.option_name,
        ),
        "=",
        $._option_value,
      ),

    option_name: ($) =>
      choice(
        "server_output",
        "client_output",
        "types_output",
        "remote_scope",
        "remote_folder",
        "casing",
        "write_checks",
        "typescript",
        "manual_event_loop",
        "typescript_max_tuple_length",
        "yield_type",
        "async_lib",
        "tooling",
        "tooling_output",
        "tooling_show_internal_data",
        "disable_fire_all",
      ),

    _option_value: ($) => choice($.string, $.number, $.boolean, $.identifier),

    // Types
    type_declaration: ($) =>
      seq("type", field("name", $.identifier), "=", field("value", $._type)),
    _type: ($) =>
      choice(
        $.optional_type,
        $.primitive_type,
        $.struct_type,
        $.enum_type,
        $.set_type,
        $.map_type,
      ),

    optional_type: ($) =>
      seq(
        field(
          "inner",
          choice(
            $.primitive_type,
            $.struct_type,
            $.enum_type,
            $.set_type,
            $.map_type,
          ),
        ),
        "?",
      ),

    primitive_type: ($) =>
      seq(
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
        ),
        optional($.range),
      ),

    // Ranges
    range: ($) => choice($.inclusive_range, $.exclusive_range, $.exact_range),

    inclusive_range: ($) =>
      seq("[", optional($.number), "..", optional($.number), "]"),

    exclusive_range: ($) =>
      seq("(", optional($.number), "..", optional($.number), ")"),

    exact_range: ($) => seq(choice("[", "("), $.number, choice("]", ")")),

    // Structs
    struct_type: ($) =>
      seq(
        "struct",
        "{",
        optional(
          seq($.struct_field, repeat(seq(",", $.struct_field)), optional(",")),
        ),
        "}",
      ),

    struct_field: ($) =>
      seq(field("name", $.identifier), ":", field("type", $._type)),

    // Enums
    enum_type: ($) => choice($.enum_unit_type, $.enum_tagged_type),

    enum_unit_type: ($) =>
      seq(
        "enum",
        "{",
        optional(
          seq($.identifier, repeat(seq(",", $.identifier)), optional(",")),
        ),
        "}",
      ),

    enum_tagged_type: ($) =>
      seq(
        "enum",
        $.string,
        "{",
        optional(
          seq($.enum_variant, repeat(seq(",", $.enum_variant)), optional(",")),
        ),
        "}",
      ),

    enum_variant: ($) =>
      seq(
        field("name", $.identifier),
        field("fields", optional($.enum_variant_fields)),
      ),

    enum_variant_fields: ($) =>
      seq(
        "{",
        optional(
          seq($.struct_field, repeat(seq(",", $.struct_field)), optional(",")),
        ),
        "}",
      ),

    // Events
    event_declaration: ($) =>
      seq(
        "event",
        field("name", $.identifier),
        "=",
        "{",
        optional(
          seq(
            $.event_from_field,
            repeat(
              seq(
                ",",
                choice(
                  $.event_type_field,
                  $.event_call_field,
                  $.event_data_field,
                ),
              ),
            ),
            optional(","),
          ),
        ),
        "}",
      ),

    event_from_field: ($) =>
      seq(
        "from",
        ":",
        field("value", alias(choice("Server", "Client"), $.event_from_value)),
      ),

    event_type_field: ($) =>
      seq(
        "type",
        ":",
        field(
          "value",
          alias(choice("Reliable", "Unreliable"), $.event_type_value),
        ),
      ),

    event_call_field: ($) =>
      seq(
        "call",
        ":",
        field(
          "value",
          alias(
            choice(
              "ManyAsync",
              "ManySync",
              "SingleAsync",
              "SingleSync",
              "Polling",
            ),
            $.event_call_value,
          ),
        ),
      ),

    event_data_field: ($) =>
      seq("data", ":", choice($._type, $.event_data_tuple)),

    event_data_tuple: ($) =>
      seq(
        "(",
        optional(
          seq(
            choice(
              seq(field("name", $.identifier), ":", field("type", $._type)),
              field("type", $._type),
            ),
            repeat(
              seq(
                ",",
                choice(
                  seq(field("name", $.identifier), ":", field("type", $._type)),
                  field("type", $._type),
                ),
              ),
            ),
            optional(","),
          ),
        ),
        ")",
      ),

    // Functions
    function_declaration: ($) =>
      seq(
        "funct",
        field("name", $.identifier),
        "=",
        "{",
        optional(
          seq(
            $.function_call_field,
            repeat(
              seq(",", choice($.function_args_field, $.function_rets_field)),
            ),
            optional(","),
          ),
        ),
        "}",
      ),

    function_call_field: ($) =>
      seq(
        "call",
        ":",
        field("value", alias(choice("Async", "Sync"), $.function_call_value)),
      ),

    function_args_field: ($) =>
      seq(
        "args",
        ":",
        choice(
          $._type,
          $.event_data_tuple, // We can reuse the tuple syntax from events
        ),
      ),

    function_rets_field: ($) =>
      seq(
        "rets",
        ":",
        choice(
          $._type,
          $.event_data_tuple, // We can reuse the tuple syntax from events
        ),
      ),

    // Sets
    set_type: ($) => seq("set", "{", field("type", $._type), "}"),

    // Maps
    map_type: ($) =>
      seq(
        "map",
        "{",
        "[",
        field("key_type", $._type),
        "]",
        ":",
        field("value_type", $._type),
        "}",
      ),

    // Basic values
    string: ($) => token(/"[^"]*"/),
    number: ($) => /\d+/,
    boolean: ($) => choice("true", "false"),
  },
});
