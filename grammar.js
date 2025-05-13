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

  extras: ($) => [/\s/, $.doc_comment, $.comment],

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
    doc_comment: ($) => token(seq("---", /.*/)),
    comment: ($) => token(seq("--", /.*/)),

    // Identifiers
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Options
    option_declaration: ($) =>
      seq(
        "opt",
        $.identifier,
        "=",
        choice($.string, $.number, $.boolean, $.identifier),
      ),

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
        $.identifier,
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
            $.identifier,
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
          "Instance",
          seq("Instance", "(", $.identifier, ")"),
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
      seq("struct", field("properties", seq("{", repeat($.property), "}"))),

    // Enums
    enum_type: ($) => choice($.enum_unit_type, $.enum_tagged_type),

    enum_unit_type: ($) =>
      seq("enum", "{", repeat(seq($.identifier, optional(","))), "}"),

    enum_tagged_type: ($) =>
      seq(
        "enum",
        $.string,
        "{",
        repeat(seq($.enum_tagged_variant, optional(","))),
        "}",
      ),

    enum_tagged_variant: ($) =>
      seq(
        field("name", $.identifier),
        optional(field("properties", seq("{", repeat($.property), "}"))),
      ),

    // Events
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
        field("value", alias(choice("Server", "Client"), $.event_from_value)),
        optional(","),
      ),

    event_type_field: ($) =>
      seq(
        "type",
        ":",
        field(
          "value",
          alias(choice("Reliable", "Unreliable"), $.event_type_value),
        ),
        optional(","),
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
        optional(","),
      ),

    event_data_field: ($) =>
      seq("data", ":", choice($.event_data_tuple, $._type), optional(",")),

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
        field("value", alias(choice("Async", "Sync"), $.function_call_value)),
        optional(","),
      ),

    function_args_field: ($) =>
      seq(
        "args",
        ":",
        choice(
          $.event_data_tuple, // We can reuse the tuple syntax from events
          $._type,
        ),
        optional(","),
      ),

    function_rets_field: ($) =>
      seq(
        "rets",
        ":",
        choice(
          $.event_data_tuple, // We can reuse the tuple syntax from events
          $._type,
        ),
        optional(","),
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
    property: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $._type),
        optional(","),
      ),
  },
});
