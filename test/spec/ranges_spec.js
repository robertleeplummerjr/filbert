var util = require('./util.js');

// TODO: range testing is super tedious


function ppJSON(v) { return JSON.stringify(v, null, 2); }
function addPath(str, pt) {
  if (str.charAt(str.length - 1) == ")")
    return str.slice(0, str.length - 1) + "/" + pt + ")";
  return str + " (" + pt + ")";
}
function misMatch(exp, act) {
  if (!exp || !act || (typeof exp != "object") || (typeof act != "object")) {
    if (exp !== act) return ppJSON(exp) + " !== " + ppJSON(act);
  } else if (exp.splice) {
    if (!act.slice) return ppJSON(exp) + " != " + ppJSON(act);
    if (act.length != exp.length) return "array length mismatch " + exp.length + " != " + act.length;
    for (var i = 0; i < act.length; ++i) {
      var mis = misMatch(exp[i], act[i]);
      if (mis) return addPath(mis, i);
    }
  } else {
    for (var prop in exp) {
      var mis = misMatch(exp[prop], act[prop]);
      if (mis) return addPath(mis, prop);
    }
  }
}

describe("Source Locations", function () {
  describe("line and column locations", function () {
    it("for loop", function () {
      var code = "for i in range(10): x = i";
      var ast = util.parse(code, { locations: true });

      expect(ast.loc).toEqual({ start: { line: 1, column: 0 }, end: { line: 1, column: 25 } });

      // var tmp = range(10);
      expect(ast.body[0].body[0].loc).toEqual({ start: { line: 1, column: 9 }, end: { line: 1, column: 18 } });
      expect(ast.body[0].body[0].declarations[0].id.loc).toEqual({ start: { line: 1, column: 9 }, end: { line: 1, column: 18 } });
      expect(ast.body[0].body[0].declarations[0].id.loc).toEqual({ start: { line: 1, column: 9 }, end: { line: 1, column: 18 } });
      expect(ast.body[0].body[0].declarations[0].init.arguments[0].value).toEqual(10);
      expect(ast.body[0].body[0].declarations[0].init.arguments[0].loc).toEqual({ start: { line: 1, column: 15 }, end: { line: 1, column: 17 } });
      expect(ast.body[0].body[0].declarations[0].init.callee.property.name).toEqual('range');
      expect(ast.body[0].body[0].declarations[0].init.callee.property.loc).toEqual({ start: { line: 1, column: 9 }, end: { line: 1, column: 14 } });

      // if (sequence) { for(;;)
      expect(ast.body[0].body[1].loc).toEqual({ start: { line: 1, column: 0 }, end: { line: 1, column: 25 } });
      expect(ast.body[0].body[1].test.left.loc).toEqual({ start: { line: 1, column: 0 }, end: { line: 1, column: 25 } });
      expect(ast.body[0].body[1].consequent.body[0].init.loc).toEqual({ start: { line: 1, column: 4 }, end: { line: 1, column: 5 } });
      expect(ast.body[0].body[1].consequent.body[0].init.declarations[0].init.loc).toEqual({ start: { line: 1, column: 4 }, end: { line: 1, column: 5 } });
      expect(ast.body[0].body[1].consequent.body[0].test.left.loc).toEqual({ start: { line: 1, column: 4 }, end: { line: 1, column: 5 } });
      expect(ast.body[0].body[1].consequent.body[0].test.right.object.loc).toEqual({ start: { line: 1, column: 4 }, end: { line: 1, column: 5 } });
      expect(ast.body[0].body[1].consequent.body[0].update.argument.loc).toEqual({ start: { line: 1, column: 4 }, end: { line: 1, column: 5 } });

      // i = tmp[index]
      expect(ast.body[0].body[1].consequent.body[0].body.body[0].declarations[0].id.name).toEqual('i');
      expect(ast.body[0].body[1].consequent.body[0].body.body[0].declarations[0].id.loc).toEqual({ start: { line: 1, column: 4 }, end: { line: 1, column: 5 } });

      // x = i
      expect(ast.body[0].body[1].consequent.body[0].body.body[1].loc).toEqual({ start: { line: 1, column: 20 }, end: { line: 1, column: 21 } });
      expect(ast.body[0].body[1].consequent.body[0].body.body[1].declarations[0].id.name).toEqual('x');
      expect(ast.body[0].body[1].consequent.body[0].body.body[1].declarations[0].id.loc).toEqual({ start: { line: 1, column: 20 }, end: { line: 1, column: 21 } });
      expect(ast.body[0].body[1].consequent.body[0].body.body[1].declarations[0].init.name).toEqual('i');
      expect(ast.body[0].body[1].consequent.body[0].body.body[1].declarations[0].init.loc).toEqual({ start: { line: 1, column: 24 }, end: { line: 1, column: 25 } });

      // } else { for(in)
      expect(ast.body[0].body[1].alternate.body[0].loc).toEqual({ start: { line: 1, column: 0 }, end: { line: 1, column: 25 } });
      expect(ast.body[0].body[1].alternate.body[0].left.name).toEqual('i');
      expect(ast.body[0].body[1].alternate.body[0].left.loc).toEqual({ start: { line: 1, column: 4 }, end: { line: 1, column: 5 } });
      expect(ast.body[0].body[1].alternate.body[0].body.body[0].loc).toEqual({ start: { line: 1, column: 20 }, end: { line: 1, column: 21 } });
      expect(ast.body[0].body[1].alternate.body[0].body.body[0].declarations[0].id.name).toEqual('x');
      expect(ast.body[0].body[1].alternate.body[0].body.body[0].declarations[0].id.loc).toEqual({ start: { line: 1, column: 20 }, end: { line: 1, column: 21 } });
      expect(ast.body[0].body[1].alternate.body[0].body.body[0].declarations[0].init.name).toEqual('i');
      expect(ast.body[0].body[1].alternate.body[0].body.body[0].declarations[0].init.loc).toEqual({ start: { line: 1, column: 24 }, end: { line: 1, column: 25 } });
    });

    it("x = 3", function () {
      var code = "x = 3";
      var ast = util.parse(code, { locations: true });
      var expected =
      {
        "type": "Program",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 5
          }
        },
        "body": [
          {
            "type": "VariableDeclaration",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 1,
                "column": 1
              }
            },
            "kind": "var",
            "declarations": [
              {
                "type": "VariableDeclarator",
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 1
                  }
                },
                "id": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 0
                    },
                    "end": {
                      "line": 1,
                      "column": 1
                    }
                  },
                  "name": "x"
                },
                "init": {
                  "type": "Literal",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 4
                    },
                    "end": {
                      "line": 1,
                      "column": 5
                    }
                  },
                  "value": 3,
                  "raw": "3"
                }
              }
            ]
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("comments", function () {
      var code = "# Hello, world!\n\n#   Another hello\nx = 42";
      var ast = util.parse(code, { locations: true });
      var expected =
      {
        "type": "Program",
        "loc": {
          "start": {
            "line": 1,
            "column": 15
          },
          "end": {
            "line": 4,
            "column": 6
          }
        },
        "body": [
          {
            "type": "VariableDeclaration",

            "loc": {
              "start": {
                "line": 4,
                "column": 0
              },
              "end": {
                "line": 4,
                "column": 1
              }
            },
            "kind": "var",
            "declarations": [
              {
                "type": "VariableDeclarator",
    
                "loc": {
                  "start": {
                    "line": 4,
                    "column": 0
                  },
                  "end": {
                    "line": 4,
                    "column": 1
                  }
                },
                "id": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 4,
                      "column": 0
                    },
                    "end": {
                      "line": 4,
                      "column": 1
                    }
                  },
                  "name": "x"
                },
                "init": {
                  "type": "Literal",
                  "loc": {
                    "start": {
                      "line": 4,
                      "column": 4
                    },
                    "end": {
                      "line": 4,
                      "column": 6
                    }
                  },
                  "value": 42,
                  "raw": "42"
                }
              }
            ]
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("while loop", function () {
      var code = "x = 0\nwhile x < 3:\n print(x)\n x += 1";
      var ast = util.parse(code, { locations: true });
      var expected =
      {
        "type": "Program",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 4,
            "column": 7
          }
        },
        "body": [
          {
            "type": "VariableDeclaration",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 1,
                "column": 1
              }
            },
            "kind": "var",
            "declarations": [
              {
                "type": "VariableDeclarator",
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 1
                  }
                },
                "id": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 0
                    },
                    "end": {
                      "line": 1,
                      "column": 1
                    }
                  },
                  "name": "x"
                },
                "init": {
                  "type": "Literal",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 4
                    },
                    "end": {
                      "line": 1,
                      "column": 5
                    }
                  },
                  "value": 0,
                  "raw": "0"
                }
              }
            ]
          },
          {
            "type": "WhileStatement",
            "loc": {
              "start": {
                "line": 2,
                "column": 0
              },
              "end": {
                "line": 4,
                "column": 7
              }
            },
            "test": {
              "type": "BinaryExpression",
              "loc": {
                "start": {
                  "line": 2,
                  "column": 6
                },
                "end": {
                  "line": 2,
                  "column": 11
                }
              },
              "operator": "<",
              "left": {
                "type": "Identifier",
                "loc": {
                  "start": {
                    "line": 2,
                    "column": 6
                  },
                  "end": {
                    "line": 2,
                    "column": 7
                  }
                },
                "name": "x"
              },
              "right": {
                "type": "Literal",
                "loc": {
                  "start": {
                    "line": 2,
                    "column": 10
                  },
                  "end": {
                    "line": 2,
                    "column": 11
                  }
                },
                "value": 3,
                "raw": "3"
              }
            },
            "body": {
              "type": "BlockStatement",
              "loc": {
                "start": {
                  "line": 2,
                  "column": 12
                },
                "end": {
                  "line": 4,
                  "column": 7
                }
              },
              "body": [
                {
                  "type": "ExpressionStatement",
                  "loc": {
                    "start": {
                      "line": 3,
                      "column": 1
                    },
                    "end": {
                      "line": 3,
                      "column": 9
                    }
                  },
                  "expression": {
                    "type": "CallExpression",
                    "loc": {
                      "start": {
                        "line": 3,
                        "column": 1
                      },
                      "end": {
                        "line": 3,
                        "column": 9
                      }
                    },
                    "arguments": [
                      {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 7
                          },
                          "end": {
                            "line": 3,
                            "column": 8
                          }
                        },
                        "name": "x"
                      }
                    ],
                    "callee": {
                      "type": "MemberExpression",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 1
                        },
                        "end": {
                          "line": 3,
                          "column": 6
                        }
                      },
                      "object": {
                        "type": "MemberExpression",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 1
                          },
                          "end": {
                            "line": 3,
                            "column": 6
                          }
                        },
                        "object": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 3,
                              "column": 1
                            },
                            "end": {
                              "line": 3,
                              "column": 6
                            }
                          },
                          "name": "__pythonRuntime"
                        },
                        "property": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 3,
                              "column": 1
                            },
                            "end": {
                              "line": 3,
                              "column": 6
                            }
                          },
                          "name": "functions"
                        },
                        "computed": false
                      },
                      "property": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 1
                          },
                          "end": {
                            "line": 3,
                            "column": 6
                          }
                        },
                        "name": "print"
                      },
                      "computed": false
                    }
                  }
                },
                {
                  "type": "ExpressionStatement",
                  "loc": {
                    "start": {
                      "line": 4,
                      "column": 1
                    },
                    "end": {
                      "line": 4,
                      "column": 7
                    }
                  },
                  "expression": {
                    "type": "AssignmentExpression",
                    "loc": {
                      "start": {
                        "line": 4,
                        "column": 1
                      },
                      "end": {
                        "line": 4,
                        "column": 7
                      }
                    },
                    "operator": "=",
                    "left": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 4,
                          "column": 1
                        },
                        "end": {
                          "line": 4,
                          "column": 2
                        }
                      },
                      "name": "x"
                    },
                    "right": {
                      "type": "CallExpression",
                      "loc": {
                        "start": {
                          "line": 4,
                          "column": 6
                        },
                        "end": {
                          "line": 4,
                          "column": 7
                        }
                      },
                      "callee": {
                        "type": "MemberExpression",
                        "loc": {
                          "start": {
                            "line": 4,
                            "column": 6
                          },
                          "end": {
                            "line": 4,
                            "column": 7
                          }
                        },
                        "object": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 4,
                              "column": 6
                            },
                            "end": {
                              "line": 4,
                              "column": 7
                            }
                          },
                          "object": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 4,
                                "column": 6
                              },
                              "end": {
                                "line": 4,
                                "column": 7
                              }
                            },
                            "name": "__pythonRuntime"
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 4,
                                "column": 6
                              },
                              "end": {
                                "line": 4,
                                "column": 7
                              }
                            },
                            "name": "ops"
                          },
                          "computed": false
                        },
                        "property": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 4,
                              "column": 6
                            },
                            "end": {
                              "line": 4,
                              "column": 7
                            }
                          },
                          "name": "add"
                        },
                        "computed": false
                      },
                      "arguments": [
                        {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 4,
                              "column": 1
                            },
                            "end": {
                              "line": 4,
                              "column": 2
                            }
                          },
                          "name": "x"
                        },
                        {
                          "type": "Literal",
                          "loc": {
                            "start": {
                              "line": 4,
                              "column": 6
                            },
                            "end": {
                              "line": 4,
                              "column": 7
                            }
                          },
                          "value": 1,
                          "raw": "1"
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("class with inheritance", function () {
      var code = "class ParentClass:\n  data = 5\n  def f(self):\n    return 'hello world'\nclass MyClass(ParentClass):\n  def __init__(self, s):\n    self.str = s\nx = MyClass('test')\nprint(x.f())\nprint(x.str)";
      var ast = util.parse(code, { locations: true });
      var expected =
      {
        "type": "Program",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 10,
            "column": 12
          }
        },
        "body": [
          {
            "type": "BlockStatement",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 5,
                "column": 0
              }
            },
            "body": [
              {
                "type": "FunctionDeclaration",
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 0
                  },
                  "end": {
                    "line": 5,
                    "column": 0
                  }
                },
                "id": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 6
                    },
                    "end": {
                      "line": 1,
                      "column": 17
                    }
                  },
                  "name": "ParentClass"
                },
                "params": [],
                "body": {
                  "type": "BlockStatement",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 18
                    },
                    "end": {
                      "line": 5,
                      "column": 0
                    }
                  },
                  "body": [
                    {
                      "type": "ExpressionStatement",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 2
                        },
                        "end": {
                          "line": 2,
                          "column": 10
                        }
                      },
                      "expression": {
                        "type": "AssignmentExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 2
                          },
                          "end": {
                            "line": 2,
                            "column": 10
                          }
                        },
                        "operator": "=",
                        "left": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 2
                            },
                            "end": {
                              "line": 2,
                              "column": 6
                            }
                          },
                          "object": {
                            "type": "ThisExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 2
                              },
                              "end": {
                                "line": 2,
                                "column": 6
                              }
                            }
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 2
                              },
                              "end": {
                                "line": 2,
                                "column": 6
                              }
                            },
                            "name": "data"
                          }
                        },
                        "right": {
                          "type": "Literal",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 9
                            },
                            "end": {
                              "line": 2,
                              "column": 10
                            }
                          },
                          "value": 5,
                          "raw": "5"
                        }
                      }
                    }
                  ]
                }
              },
              {
                "type": "ExpressionStatement",
                "loc": {
                  "start": {
                    "line": 3,
                    "column": 2
                  },
                  "end": {
                    "line": 5,
                    "column": 0
                  }
                },
                "expression": {
                  "type": "AssignmentExpression",
                  "loc": {
                    "start": {
                      "line": 3,
                      "column": 2
                    },
                    "end": {
                      "line": 5,
                      "column": 0
                    }
                  },
                  "left": {
                    "type": "MemberExpression",
                    "loc": {
                      "start": {
                        "line": 3,
                        "column": 2
                      },
                      "end": {
                        "line": 5,
                        "column": 0
                      }
                    },
                    "object": {
                      "type": "MemberExpression",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 2
                        },
                        "end": {
                          "line": 5,
                          "column": 0
                        }
                      },
                      "object": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 2
                          },
                          "end": {
                            "line": 5,
                            "column": 0
                          }
                        },
                        "name": "ParentClass"
                      },
                      "property": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 2
                          },
                          "end": {
                            "line": 5,
                            "column": 0
                          }
                        },
                        "name": "prototype"
                      },
                      "computed": false
                    },
                    "property": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 6
                        },
                        "end": {
                          "line": 3,
                          "column": 7
                        }
                      },
                      "name": "f"
                    },
                    "computed": false
                  },
                  "operator": "=",
                  "right": {
                    "type": "FunctionExpression",
                    "loc": {
                      "start": {
                        "line": 3,
                        "column": 2
                      },
                      "end": {
                        "line": 5,
                        "column": 0
                      }
                    },
                    "body": {
                      "type": "BlockStatement",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 14
                        },
                        "end": {
                          "line": 5,
                          "column": 0
                        }
                      },
                      "body": [
                        {
                          "type": "ReturnStatement",
                          "loc": {
                            "start": {
                              "line": 3,
                              "column": 14
                            },
                            "end": {
                              "line": 5,
                              "column": 0
                            }
                          },
                          "argument": {
                            "type": "CallExpression",
                            "loc": {
                              "start": {
                                "line": 3,
                                "column": 14
                              },
                              "end": {
                                "line": 5,
                                "column": 0
                              }
                            },
                            "callee": {
                              "type": "MemberExpression",
                              "loc": {
                                "start": {
                                  "line": 3,
                                  "column": 14
                                },
                                "end": {
                                  "line": 5,
                                  "column": 0
                                }
                              },
                              "computed": false,
                              "object": {
                                "type": "FunctionExpression",
                                "loc": {
                                  "start": {
                                    "line": 3,
                                    "column": 14
                                  },
                                  "end": {
                                    "line": 5,
                                    "column": 0
                                  }
                                },
                                "params": [],
                                "defaults": [],
                                "body": {
                                  "type": "BlockStatement",
                                  "loc": {
                                    "start": {
                                      "line": 3,
                                      "column": 14
                                    },
                                    "end": {
                                      "line": 5,
                                      "column": 0
                                    }
                                  },
                                  "body": [
                                    {
                                      "type": "ReturnStatement",
                                      "loc": {
                                        "start": {
                                          "line": 4,
                                          "column": 4
                                        },
                                        "end": {
                                          "line": 4,
                                          "column": 24
                                        }
                                      },
                                      "argument": {
                                        "type": "Literal",
                                        "loc": {
                                          "start": {
                                            "line": 4,
                                            "column": 11
                                          },
                                          "end": {
                                            "line": 4,
                                            "column": 24
                                          }
                                        },
                                        "value": "hello world",
                                        "raw": "'hello world'"
                                      }
                                    }
                                  ]
                                },
                                "generator": false,
                                "expression": false
                              },
                              "property": {
                                "type": "Identifier",
                                "loc": {
                                  "start": {
                                    "line": 3,
                                    "column": 14
                                  },
                                  "end": {
                                    "line": 5,
                                    "column": 0
                                  }
                                },
                                "name": "call"
                              }
                            },
                            "arguments": [
                              {
                                "type": "ThisExpression",
                                "loc": {
                                  "start": {
                                    "line": 3,
                                    "column": 14
                                  },
                                  "end": {
                                    "line": 5,
                                    "column": 0
                                  }
                                }
                              }
                            ]
                          }
                        }
                      ]
                    },
                    "params": []
                  }
                }
              }
            ]
          },
          {
            "type": "BlockStatement",
            "loc": {
              "start": {
                "line": 5,
                "column": 0
              },
              "end": {
                "line": 8,
                "column": 0
              }
            },
            "body": [
              {
                "type": "FunctionDeclaration",
                "loc": {
                  "start": {
                    "line": 5,
                    "column": 0
                  },
                  "end": {
                    "line": 8,
                    "column": 0
                  }
                },
                "id": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 6
                    },
                    "end": {
                      "line": 5,
                      "column": 13
                    }
                  },
                  "name": "MyClass"
                },
                "params": [],
                "body": {
                  "type": "BlockStatement",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 27
                    },
                    "end": {
                      "line": 8,
                      "column": 0
                    }
                  },
                  "body": [
                    {
                      "type": "ExpressionStatement",
                      "loc": {
                        "start": {
                          "line": 5,
                          "column": 27
                        },
                        "end": {
                          "line": 5,
                          "column": 27
                        }
                      },
                      "expression": {
                        "type": "CallExpression",
                        "loc": {
                          "start": {
                            "line": 5,
                            "column": 27
                          },
                          "end": {
                            "line": 5,
                            "column": 27
                          }
                        },
                        "callee": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 5,
                              "column": 27
                            },
                            "end": {
                              "line": 5,
                              "column": 27
                            }
                          },
                          "object": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 5,
                                "column": 27
                              },
                              "end": {
                                "line": 5,
                                "column": 27
                              }
                            },
                            "name": "ParentClass"
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 5,
                                "column": 27
                              },
                              "end": {
                                "line": 5,
                                "column": 27
                              }
                            },
                            "name": "call"
                          },
                          "computed": false
                        },
                        "arguments": [
                          {
                            "type": "ThisExpression",
                            "loc": {
                              "start": {
                                "line": 5,
                                "column": 27
                              },
                              "end": {
                                "line": 5,
                                "column": 27
                              }
                            }
                          }
                        ]
                      }
                    },
                    {
                      "type": "VariableDeclaration",
                      "loc": {
                        "start": {
                          "line": 6,
                          "column": 6
                        },
                        "end": {
                          "line": 6,
                          "column": 14
                        }
                      },
                      "kind": "var",
                      "declarations": [
                        {
                          "type": "VariableDeclarator",
                          "loc": {
                            "start": {
                              "line": 6,
                              "column": 6
                            },
                            "end": {
                              "line": 6,
                              "column": 14
                            }
                          },
                          "id": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "name": "__params1"
                          },
                          "init": {
                            "type": "ConditionalExpression",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "test": {
                              "type": "LogicalExpression",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 6
                                },
                                "end": {
                                  "line": 6,
                                  "column": 14
                                }
                              },
                              "operator": "&&",
                              "left": {
                                "type": "LogicalExpression",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 14
                                  }
                                },
                                "operator": "&&",
                                "left": {
                                  "type": "BinaryExpression",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "operator": "===",
                                  "left": {
                                    "type": "MemberExpression",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "computed": false,
                                    "object": {
                                      "type": "Identifier",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "name": "arguments"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "name": "length"
                                    }
                                  },
                                  "right": {
                                    "type": "Literal",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "value": 1
                                  }
                                },
                                "right": {
                                  "type": "MemberExpression",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "computed": false,
                                  "object": {
                                    "type": "MemberExpression",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "computed": true,
                                    "object": {
                                      "type": "Identifier",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "name": "arguments"
                                    },
                                    "property": {
                                      "type": "Literal",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "value": 0
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "name": "formals"
                                  }
                                }
                              },
                              "right": {
                                "type": "MemberExpression",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 14
                                  }
                                },
                                "computed": false,
                                "object": {
                                  "type": "MemberExpression",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "computed": true,
                                  "object": {
                                    "type": "Identifier",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "name": "arguments"
                                  },
                                  "property": {
                                    "type": "Literal",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "value": 0
                                  }
                                },
                                "property": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "name": "keywords"
                                }
                              }
                            },
                            "consequent": {
                              "type": "MemberExpression",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 6
                                },
                                "end": {
                                  "line": 6,
                                  "column": 14
                                }
                              },
                              "computed": true,
                              "object": {
                                "type": "Identifier",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 14
                                  }
                                },
                                "name": "arguments"
                              },
                              "property": {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 14
                                  }
                                },
                                "value": 0
                              }
                            },
                            "alternate": {
                              "type": "Literal",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 6
                                },
                                "end": {
                                  "line": 6,
                                  "column": 14
                                }
                              },
                              "value": null
                            }
                          }
                        }
                      ]
                    },
                    {
                      "type": "VariableDeclaration",
                      "loc": {
                        "start": {
                          "line": 6,
                          "column": 6
                        },
                        "end": {
                          "line": 6,
                          "column": 14
                        }
                      },
                      "kind": "var",
                      "declarations": [
                        {
                          "type": "VariableDeclarator",
                          "loc": {
                            "start": {
                              "line": 6,
                              "column": 6
                            },
                            "end": {
                              "line": 6,
                              "column": 14
                            }
                          },
                          "id": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "name": "__formalsIndex1"
                          },
                          "init": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "value": 0
                          }
                        }
                      ]
                    },
                    {
                      "type": "VariableDeclaration",
                      "loc": {
                        "start": {
                          "line": 6,
                          "column": 6
                        },
                        "end": {
                          "line": 6,
                          "column": 14
                        }
                      },
                      "kind": "var",
                      "declarations": [
                        {
                          "type": "VariableDeclarator",
                          "loc": {
                            "start": {
                              "line": 6,
                              "column": 6
                            },
                            "end": {
                              "line": 6,
                              "column": 14
                            }
                          },
                          "id": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "name": "__args1"
                          },
                          "init": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "name": "arguments"
                          }
                        }
                      ]
                    },
                    {
                      "type": "FunctionDeclaration",
                      "loc": {
                        "start": {
                          "line": 6,
                          "column": 6
                        },
                        "end": {
                          "line": 6,
                          "column": 14
                        }
                      },
                      "id": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 6,
                            "column": 6
                          },
                          "end": {
                            "line": 6,
                            "column": 14
                          }
                        },
                        "name": "__getParam1"
                      },
                      "params": [
                        {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 6,
                              "column": 6
                            },
                            "end": {
                              "line": 6,
                              "column": 14
                            }
                          },
                          "name": "v"
                        },
                        {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 6,
                              "column": 6
                            },
                            "end": {
                              "line": 6,
                              "column": 14
                            }
                          },
                          "name": "d"
                        }
                      ],
                      "defaults": [],
                      "body": {
                        "type": "BlockStatement",
                        "loc": {
                          "start": {
                            "line": 6,
                            "column": 6
                          },
                          "end": {
                            "line": 6,
                            "column": 14
                          }
                        },
                        "body": [
                          {
                            "type": "VariableDeclaration",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "kind": "var",
                            "declarations": [
                              {
                                "type": "VariableDeclarator",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 14
                                  }
                                },
                                "id": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "name": "r"
                                },
                                "init": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "name": "d"
                                }
                              }
                            ]
                          },
                          {
                            "type": "IfStatement",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "test": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 6
                                },
                                "end": {
                                  "line": 6,
                                  "column": 14
                                }
                              },
                              "name": "__params1"
                            },
                            "consequent": {
                              "type": "BlockStatement",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 6
                                },
                                "end": {
                                  "line": 6,
                                  "column": 14
                                }
                              },
                              "body": [
                                {
                                  "type": "IfStatement",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "test": {
                                    "type": "BinaryExpression",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "operator": "<",
                                    "left": {
                                      "type": "Identifier",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "name": "__formalsIndex1"
                                    },
                                    "right": {
                                      "type": "MemberExpression",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "computed": false,
                                      "object": {
                                        "type": "MemberExpression",
                                        "loc": {
                                          "start": {
                                            "line": 6,
                                            "column": 6
                                          },
                                          "end": {
                                            "line": 6,
                                            "column": 14
                                          }
                                        },
                                        "computed": false,
                                        "object": {
                                          "type": "Identifier",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "name": "__params1"
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "name": "formals"
                                        }
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "loc": {
                                          "start": {
                                            "line": 6,
                                            "column": 6
                                          },
                                          "end": {
                                            "line": 6,
                                            "column": 14
                                          }
                                        },
                                        "name": "length"
                                      }
                                    }
                                  },
                                  "consequent": {
                                    "type": "BlockStatement",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "body": [
                                      {
                                        "type": "ExpressionStatement",
                                        "loc": {
                                          "start": {
                                            "line": 6,
                                            "column": 6
                                          },
                                          "end": {
                                            "line": 6,
                                            "column": 14
                                          }
                                        },
                                        "expression": {
                                          "type": "AssignmentExpression",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "operator": "=",
                                          "left": {
                                            "type": "Identifier",
                                            "loc": {
                                              "start": {
                                                "line": 6,
                                                "column": 6
                                              },
                                              "end": {
                                                "line": 6,
                                                "column": 14
                                              }
                                            },
                                            "name": "r"
                                          },
                                          "right": {
                                            "type": "MemberExpression",
                                            "loc": {
                                              "start": {
                                                "line": 6,
                                                "column": 6
                                              },
                                              "end": {
                                                "line": 6,
                                                "column": 14
                                              }
                                            },
                                            "computed": true,
                                            "object": {
                                              "type": "MemberExpression",
                                              "loc": {
                                                "start": {
                                                  "line": 6,
                                                  "column": 6
                                                },
                                                "end": {
                                                  "line": 6,
                                                  "column": 14
                                                }
                                              },
                                              "computed": false,
                                              "object": {
                                                "type": "Identifier",
                                                "loc": {
                                                  "start": {
                                                    "line": 6,
                                                    "column": 6
                                                  },
                                                  "end": {
                                                    "line": 6,
                                                    "column": 14
                                                  }
                                                },
                                                "name": "__params1"
                                              },
                                              "property": {
                                                "type": "Identifier",
                                                "loc": {
                                                  "start": {
                                                    "line": 6,
                                                    "column": 6
                                                  },
                                                  "end": {
                                                    "line": 6,
                                                    "column": 14
                                                  }
                                                },
                                                "name": "formals"
                                              }
                                            },
                                            "property": {
                                              "type": "UpdateExpression",
                                              "loc": {
                                                "start": {
                                                  "line": 6,
                                                  "column": 6
                                                },
                                                "end": {
                                                  "line": 6,
                                                  "column": 14
                                                }
                                              },
                                              "operator": "++",
                                              "argument": {
                                                "type": "Identifier",
                                                "loc": {
                                                  "start": {
                                                    "line": 6,
                                                    "column": 6
                                                  },
                                                  "end": {
                                                    "line": 6,
                                                    "column": 14
                                                  }
                                                },
                                                "name": "__formalsIndex1"
                                              },
                                              "prefix": false
                                            }
                                          }
                                        }
                                      }
                                    ]
                                  },
                                  "alternate": {
                                    "type": "IfStatement",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "test": {
                                      "type": "BinaryExpression",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "operator": "in",
                                      "left": {
                                        "type": "Identifier",
                                        "loc": {
                                          "start": {
                                            "line": 6,
                                            "column": 6
                                          },
                                          "end": {
                                            "line": 6,
                                            "column": 14
                                          }
                                        },
                                        "name": "v"
                                      },
                                      "right": {
                                        "type": "MemberExpression",
                                        "loc": {
                                          "start": {
                                            "line": 6,
                                            "column": 6
                                          },
                                          "end": {
                                            "line": 6,
                                            "column": 14
                                          }
                                        },
                                        "computed": false,
                                        "object": {
                                          "type": "Identifier",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "name": "__params1"
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "name": "keywords"
                                        }
                                      }
                                    },
                                    "consequent": {
                                      "type": "BlockStatement",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "body": [
                                        {
                                          "type": "ExpressionStatement",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "expression": {
                                            "type": "AssignmentExpression",
                                            "loc": {
                                              "start": {
                                                "line": 6,
                                                "column": 6
                                              },
                                              "end": {
                                                "line": 6,
                                                "column": 14
                                              }
                                            },
                                            "operator": "=",
                                            "left": {
                                              "type": "Identifier",
                                              "loc": {
                                                "start": {
                                                  "line": 6,
                                                  "column": 6
                                                },
                                                "end": {
                                                  "line": 6,
                                                  "column": 14
                                                }
                                              },
                                              "name": "r"
                                            },
                                            "right": {
                                              "type": "MemberExpression",
                                              "loc": {
                                                "start": {
                                                  "line": 6,
                                                  "column": 6
                                                },
                                                "end": {
                                                  "line": 6,
                                                  "column": 14
                                                }
                                              },
                                              "computed": true,
                                              "property": {
                                                "type": "Identifier",
                                                "loc": {
                                                  "start": {
                                                    "line": 6,
                                                    "column": 6
                                                  },
                                                  "end": {
                                                    "line": 6,
                                                    "column": 14
                                                  }
                                                },
                                                "name": "v"
                                              },
                                              "object": {
                                                "type": "MemberExpression",
                                                "loc": {
                                                  "start": {
                                                    "line": 6,
                                                    "column": 6
                                                  },
                                                  "end": {
                                                    "line": 6,
                                                    "column": 14
                                                  }
                                                },
                                                "computed": false,
                                                "object": {
                                                  "type": "Identifier",
                                                  "loc": {
                                                    "start": {
                                                      "line": 6,
                                                      "column": 6
                                                    },
                                                    "end": {
                                                      "line": 6,
                                                      "column": 14
                                                    }
                                                  },
                                                  "name": "__params1"
                                                },
                                                "property": {
                                                  "type": "Identifier",
                                                  "loc": {
                                                    "start": {
                                                      "line": 6,
                                                      "column": 6
                                                    },
                                                    "end": {
                                                      "line": 6,
                                                      "column": 14
                                                    }
                                                  },
                                                  "name": "keywords"
                                                }
                                              }
                                            }
                                          }
                                        },
                                        {
                                          "type": "ExpressionStatement",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "expression": {
                                            "type": "UnaryExpression",
                                            "loc": {
                                              "start": {
                                                "line": 6,
                                                "column": 6
                                              },
                                              "end": {
                                                "line": 6,
                                                "column": 14
                                              }
                                            },
                                            "operator": "delete",
                                            "prefix": true,
                                            "argument": {
                                              "type": "MemberExpression",
                                              "loc": {
                                                "start": {
                                                  "line": 6,
                                                  "column": 6
                                                },
                                                "end": {
                                                  "line": 6,
                                                  "column": 14
                                                }
                                              },
                                              "computed": true,
                                              "property": {
                                                "type": "Identifier",
                                                "loc": {
                                                  "start": {
                                                    "line": 6,
                                                    "column": 6
                                                  },
                                                  "end": {
                                                    "line": 6,
                                                    "column": 14
                                                  }
                                                },
                                                "name": "v"
                                              },
                                              "object": {
                                                "type": "MemberExpression",
                                                "loc": {
                                                  "start": {
                                                    "line": 6,
                                                    "column": 6
                                                  },
                                                  "end": {
                                                    "line": 6,
                                                    "column": 14
                                                  }
                                                },
                                                "computed": false,
                                                "object": {
                                                  "type": "Identifier",
                                                  "loc": {
                                                    "start": {
                                                      "line": 6,
                                                      "column": 6
                                                    },
                                                    "end": {
                                                      "line": 6,
                                                      "column": 14
                                                    }
                                                  },
                                                  "name": "__params1"
                                                },
                                                "property": {
                                                  "type": "Identifier",
                                                  "loc": {
                                                    "start": {
                                                      "line": 6,
                                                      "column": 6
                                                    },
                                                    "end": {
                                                      "line": 6,
                                                      "column": 14
                                                    }
                                                  },
                                                  "name": "keywords"
                                                }
                                              }
                                            }
                                          }
                                        }
                                      ]
                                    },
                                    "alternate": null
                                  }
                                }
                              ]
                            },
                            "alternate": {
                              "type": "IfStatement",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 6
                                },
                                "end": {
                                  "line": 6,
                                  "column": 14
                                }
                              },
                              "test": {
                                "type": "BinaryExpression",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 14
                                  }
                                },
                                "operator": "<",
                                "left": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "name": "__formalsIndex1"
                                },
                                "right": {
                                  "type": "MemberExpression",
                                  "loc": {
                                    "start": {
                                      "line": 6,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 6,
                                      "column": 14
                                    }
                                  },
                                  "computed": false,
                                  "object": {
                                    "type": "Identifier",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "name": "__args1"
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "name": "length"
                                  }
                                }
                              },
                              "consequent": {
                                "type": "BlockStatement",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 14
                                  }
                                },
                                "body": [
                                  {
                                    "type": "ExpressionStatement",
                                    "loc": {
                                      "start": {
                                        "line": 6,
                                        "column": 6
                                      },
                                      "end": {
                                        "line": 6,
                                        "column": 14
                                      }
                                    },
                                    "expression": {
                                      "type": "AssignmentExpression",
                                      "loc": {
                                        "start": {
                                          "line": 6,
                                          "column": 6
                                        },
                                        "end": {
                                          "line": 6,
                                          "column": 14
                                        }
                                      },
                                      "operator": "=",
                                      "left": {
                                        "type": "Identifier",
                                        "loc": {
                                          "start": {
                                            "line": 6,
                                            "column": 6
                                          },
                                          "end": {
                                            "line": 6,
                                            "column": 14
                                          }
                                        },
                                        "name": "r"
                                      },
                                      "right": {
                                        "type": "MemberExpression",
                                        "loc": {
                                          "start": {
                                            "line": 6,
                                            "column": 6
                                          },
                                          "end": {
                                            "line": 6,
                                            "column": 14
                                          }
                                        },
                                        "computed": true,
                                        "object": {
                                          "type": "Identifier",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "name": "__args1"
                                        },
                                        "property": {
                                          "type": "UpdateExpression",
                                          "loc": {
                                            "start": {
                                              "line": 6,
                                              "column": 6
                                            },
                                            "end": {
                                              "line": 6,
                                              "column": 14
                                            }
                                          },
                                          "operator": "++",
                                          "argument": {
                                            "type": "Identifier",
                                            "loc": {
                                              "start": {
                                                "line": 6,
                                                "column": 6
                                              },
                                              "end": {
                                                "line": 6,
                                                "column": 14
                                              }
                                            },
                                            "name": "__formalsIndex1"
                                          },
                                          "prefix": false
                                        }
                                      }
                                    }
                                  }
                                ]
                              },
                              "alternate": null
                            }
                          },
                          {
                            "type": "ReturnStatement",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 6
                              },
                              "end": {
                                "line": 6,
                                "column": 14
                              }
                            },
                            "argument": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 6
                                },
                                "end": {
                                  "line": 6,
                                  "column": 14
                                }
                              },
                              "name": "r"
                            }
                          }
                        ]
                      },
                      "rest": null,
                      "generator": false,
                      "expression": false
                    },
                    {
                      "type": "VariableDeclaration",
                      "loc": {
                        "start": {
                          "line": 6,
                          "column": 21
                        },
                        "end": {
                          "line": 6,
                          "column": 22
                        }
                      },
                      "kind": "var",
                      "declarations": [
                        {
                          "type": "VariableDeclarator",
                          "loc": {
                            "start": {
                              "line": 6,
                              "column": 21
                            },
                            "end": {
                              "line": 6,
                              "column": 22
                            }
                          },
                          "id": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 21
                              },
                              "end": {
                                "line": 6,
                                "column": 22
                              }
                            },
                            "name": "s"
                          },
                          "init": {
                            "type": "CallExpression",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 21
                              },
                              "end": {
                                "line": 6,
                                "column": 22
                              }
                            },
                            "callee": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 21
                                },
                                "end": {
                                  "line": 6,
                                  "column": 22
                                }
                              },
                              "name": "__getParam1"
                            },
                            "arguments": [
                              {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 6,
                                    "column": 21
                                  },
                                  "end": {
                                    "line": 6,
                                    "column": 22
                                  }
                                },
                                "value": "s"
                              }
                            ]
                          }
                        }
                      ]
                    },
                    {
                      "type": "ReturnStatement",
                      "loc": {
                        "start": {
                          "line": 6,
                          "column": 24
                        },
                        "end": {
                          "line": 8,
                          "column": 0
                        }
                      },
                      "argument": {
                        "type": "CallExpression",
                        "loc": {
                          "start": {
                            "line": 6,
                            "column": 24
                          },
                          "end": {
                            "line": 8,
                            "column": 0
                          }
                        },
                        "callee": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 6,
                              "column": 24
                            },
                            "end": {
                              "line": 8,
                              "column": 0
                            }
                          },
                          "computed": false,
                          "object": {
                            "type": "FunctionExpression",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 24
                              },
                              "end": {
                                "line": 8,
                                "column": 0
                              }
                            },
                            "params": [],
                            "defaults": [],
                            "body": {
                              "type": "BlockStatement",
                              "loc": {
                                "start": {
                                  "line": 6,
                                  "column": 24
                                },
                                "end": {
                                  "line": 8,
                                  "column": 0
                                }
                              },
                              "body": [
                                {
                                  "type": "ExpressionStatement",
                                  "loc": {
                                    "start": {
                                      "line": 7,
                                      "column": 4
                                    },
                                    "end": {
                                      "line": 7,
                                      "column": 16
                                    }
                                  },
                                  "expression": {
                                    "type": "AssignmentExpression",
                                    "loc": {
                                      "start": {
                                        "line": 7,
                                        "column": 4
                                      },
                                      "end": {
                                        "line": 7,
                                        "column": 16
                                      }
                                    },
                                    "operator": "=",
                                    "left": {
                                      "type": "MemberExpression",
                                      "loc": {
                                        "start": {
                                          "line": 7,
                                          "column": 4
                                        },
                                        "end": {
                                          "line": 7,
                                          "column": 12
                                        }
                                      },
                                      "object": {
                                        "type": "ThisExpression",
                                        "loc": {
                                          "start": {
                                            "line": 7,
                                            "column": 4
                                          },
                                          "end": {
                                            "line": 7,
                                            "column": 8
                                          }
                                        }
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "loc": {
                                          "start": {
                                            "line": 7,
                                            "column": 9
                                          },
                                          "end": {
                                            "line": 7,
                                            "column": 12
                                          }
                                        },
                                        "name": "str"
                                      },
                                      "computed": false
                                    },
                                    "right": {
                                      "type": "Identifier",
                                      "loc": {
                                        "start": {
                                          "line": 7,
                                          "column": 15
                                        },
                                        "end": {
                                          "line": 7,
                                          "column": 16
                                        }
                                      },
                                      "name": "s"
                                    }
                                  }
                                }
                              ]
                            },
                            "generator": false,
                            "expression": false
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 24
                              },
                              "end": {
                                "line": 8,
                                "column": 0
                              }
                            },
                            "name": "call"
                          }
                        },
                        "arguments": [
                          {
                            "type": "ThisExpression",
                            "loc": {
                              "start": {
                                "line": 6,
                                "column": 24
                              },
                              "end": {
                                "line": 8,
                                "column": 0
                              }
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              {
                "type": "ExpressionStatement",
                "loc": {
                  "start": {
                    "line": 5,
                    "column": 0
                  },
                  "end": {
                    "line": 8,
                    "column": 0
                  }
                },
                "expression": {
                  "type": "AssignmentExpression",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 0
                    },
                    "end": {
                      "line": 8,
                      "column": 0
                    }
                  },
                  "left": {
                    "type": "MemberExpression",
                    "loc": {
                      "start": {
                        "line": 5,
                        "column": 0
                      },
                      "end": {
                        "line": 8,
                        "column": 0
                      }
                    },
                    "object": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 5,
                          "column": 0
                        },
                        "end": {
                          "line": 8,
                          "column": 0
                        }
                      },
                      "name": "MyClass"
                    },
                    "property": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 5,
                          "column": 0
                        },
                        "end": {
                          "line": 8,
                          "column": 0
                        }
                      },
                      "name": "prototype"
                    },
                    "computed": false
                  },
                  "operator": "=",
                  "right": {
                    "type": "CallExpression",
                    "loc": {
                      "start": {
                        "line": 5,
                        "column": 0
                      },
                      "end": {
                        "line": 8,
                        "column": 0
                      }
                    },
                    "callee": {
                      "type": "MemberExpression",
                      "loc": {
                        "start": {
                          "line": 5,
                          "column": 0
                        },
                        "end": {
                          "line": 8,
                          "column": 0
                        }
                      },
                      "object": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 5,
                            "column": 0
                          },
                          "end": {
                            "line": 8,
                            "column": 0
                          }
                        },
                        "name": "Object"
                      },
                      "property": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 5,
                            "column": 0
                          },
                          "end": {
                            "line": 8,
                            "column": 0
                          }
                        },
                        "name": "create"
                      },
                      "computed": false
                    },
                    "arguments": [
                      {
                        "type": "MemberExpression",
                        "loc": {
                          "start": {
                            "line": 5,
                            "column": 0
                          },
                          "end": {
                            "line": 8,
                            "column": 0
                          }
                        },
                        "object": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 5,
                              "column": 0
                            },
                            "end": {
                              "line": 8,
                              "column": 0
                            }
                          },
                          "name": "ParentClass"
                        },
                        "property": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 5,
                              "column": 0
                            },
                            "end": {
                              "line": 8,
                              "column": 0
                            }
                          },
                          "name": "prototype"
                        },
                        "computed": false
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "VariableDeclaration",
            "loc": {
              "start": {
                "line": 8,
                "column": 0
              },
              "end": {
                "line": 8,
                "column": 1
              }
            },
            "kind": "var",
            "declarations": [
              {
                "type": "VariableDeclarator",
                "loc": {
                  "start": {
                    "line": 8,
                    "column": 0
                  },
                  "end": {
                    "line": 8,
                    "column": 1
                  }
                },
                "id": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 8,
                      "column": 0
                    },
                    "end": {
                      "line": 8,
                      "column": 1
                    }
                  },
                  "name": "x"
                },
                "init": {
                  "type": "NewExpression",
                  "loc": {
                    "start": {
                      "line": 8,
                      "column": 4
                    },
                    "end": {
                      "line": 8,
                      "column": 19
                    }
                  },
                  "arguments": [
                    {
                      "type": "Literal",
                      "loc": {
                        "start": {
                          "line": 8,
                          "column": 12
                        },
                        "end": {
                          "line": 8,
                          "column": 18
                        }
                      },
                      "value": "test",
                      "raw": "'test'"
                    }
                  ],
                  "callee": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 8,
                        "column": 4
                      },
                      "end": {
                        "line": 8,
                        "column": 11
                      }
                    },
                    "name": "MyClass"
                  }
                }
              }
            ]
          },
          {
            "type": "ExpressionStatement",
            "loc": {
              "start": {
                "line": 9,
                "column": 0
              },
              "end": {
                "line": 9,
                "column": 12
              }
            },
            "expression": {
              "type": "CallExpression",
              "loc": {
                "start": {
                  "line": 9,
                  "column": 0
                },
                "end": {
                  "line": 9,
                  "column": 12
                }
              },
              "arguments": [
                {
                  "type": "CallExpression",
                  "loc": {
                    "start": {
                      "line": 9,
                      "column": 6
                    },
                    "end": {
                      "line": 9,
                      "column": 11
                    }
                  },
                  "arguments": [],
                  "callee": {
                    "type": "MemberExpression",
                    "loc": {
                      "start": {
                        "line": 9,
                        "column": 6
                      },
                      "end": {
                        "line": 9,
                        "column": 9
                      }
                    },
                    "object": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 9,
                          "column": 6
                        },
                        "end": {
                          "line": 9,
                          "column": 7
                        }
                      },
                      "name": "x"
                    },
                    "property": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 9,
                          "column": 8
                        },
                        "end": {
                          "line": 9,
                          "column": 9
                        }
                      },
                      "name": "f"
                    },
                    "computed": false
                  }
                }
              ],
              "callee": {
                "type": "MemberExpression",
                "loc": {
                  "start": {
                    "line": 9,
                    "column": 0
                  },
                  "end": {
                    "line": 9,
                    "column": 5
                  }
                },
                "object": {
                  "type": "MemberExpression",
                  "loc": {
                    "start": {
                      "line": 9,
                      "column": 0
                    },
                    "end": {
                      "line": 9,
                      "column": 5
                    }
                  },
                  "object": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 9,
                        "column": 0
                      },
                      "end": {
                        "line": 9,
                        "column": 5
                      }
                    },
                    "name": "__pythonRuntime"
                  },
                  "property": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 9,
                        "column": 0
                      },
                      "end": {
                        "line": 9,
                        "column": 5
                      }
                    },
                    "name": "functions"
                  },
                  "computed": false
                },
                "property": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 9,
                      "column": 0
                    },
                    "end": {
                      "line": 9,
                      "column": 5
                    }
                  },
                  "name": "print"
                },
                "computed": false
              }
            }
          },
          {
            "type": "ExpressionStatement",
            "loc": {
              "start": {
                "line": 10,
                "column": 0
              },
              "end": {
                "line": 10,
                "column": 12
              }
            },
            "expression": {
              "type": "CallExpression",
              "loc": {
                "start": {
                  "line": 10,
                  "column": 0
                },
                "end": {
                  "line": 10,
                  "column": 12
                }
              },
              "arguments": [
                {
                  "type": "MemberExpression",
                  "loc": {
                    "start": {
                      "line": 10,
                      "column": 6
                    },
                    "end": {
                      "line": 10,
                      "column": 11
                    }
                  },
                  "object": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 10,
                        "column": 6
                      },
                      "end": {
                        "line": 10,
                        "column": 7
                      }
                    },
                    "name": "x"
                  },
                  "property": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 10,
                        "column": 8
                      },
                      "end": {
                        "line": 10,
                        "column": 11
                      }
                    },
                    "name": "str"
                  },
                  "computed": false
                }
              ],
              "callee": {
                "type": "MemberExpression",
                "loc": {
                  "start": {
                    "line": 10,
                    "column": 0
                  },
                  "end": {
                    "line": 10,
                    "column": 5
                  }
                },
                "object": {
                  "type": "MemberExpression",
                  "loc": {
                    "start": {
                      "line": 10,
                      "column": 0
                    },
                    "end": {
                      "line": 10,
                      "column": 5
                    }
                  },
                  "object": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 10,
                        "column": 0
                      },
                      "end": {
                        "line": 10,
                        "column": 5
                      }
                    },
                    "name": "__pythonRuntime"
                  },
                  "property": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 10,
                        "column": 0
                      },
                      "end": {
                        "line": 10,
                        "column": 5
                      }
                    },
                    "name": "functions"
                  },
                  "computed": false
                },
                "property": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 10,
                      "column": 0
                    },
                    "end": {
                      "line": 10,
                      "column": 5
                    }
                  },
                  "name": "print"
                },
                "computed": false
              }
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("-2**2", function () {
      var code = "-2**2";
      var ast = util.parse(code, { locations: true });
      var expected =
      {
        "type": "Program",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 5
          }
        },
        "body": [
          {
            "type": "ExpressionStatement",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 1,
                "column": 5
              }
            },
            "expression": {
              "type": "UnaryExpression",
              "loc": {
                "start": {
                  "line": 1,
                  "column": 0
                },
                "end": {
                  "line": 1,
                  "column": 5
                }
              },
              "operator": "-",
              "prefix": true,
              "argument": {
                "type": "CallExpression",
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 1
                  },
                  "end": {
                    "line": 1,
                    "column": 5
                  }
                },
                "callee": {
                  "type": "MemberExpression",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 1
                    },
                    "end": {
                      "line": 1,
                      "column": 5
                    }
                  },
                  "object": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 1
                      },
                      "end": {
                        "line": 1,
                        "column": 5
                      }
                    },
                    "name": "Math"
                  },
                  "property": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 1
                      },
                      "end": {
                        "line": 1,
                        "column": 5
                      }
                    },
                    "name": "pow"
                  },
                  "computed": false
                },
                "arguments": [
                  {
                    "type": "Literal",
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 1
                      },
                      "end": {
                        "line": 1,
                        "column": 2
                      }
                    },
                    "value": 2,
                    "raw": "2"
                  },
                  {
                    "type": "Literal",
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 4
                      },
                      "end": {
                        "line": 1,
                        "column": 5
                      }
                    },
                    "value": 2,
                    "raw": "2"
                  }
                ]
              }
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("5//2", function () {
      var code = "5//2";
      var ast = util.parse(code, { locations: true });
      var expected =
      {
        "type": "Program",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 4
          }
        },
        "body": [
          {
            "type": "ExpressionStatement",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 1,
                "column": 4
              }
            },
            "expression": {
              "type": "CallExpression",
              "loc": {
                "start": {
                  "line": 1,
                  "column": 0
                },
                "end": {
                  "line": 1,
                  "column": 4
                }
              },
              "callee": {
                "type": "MemberExpression",
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 4
                  }
                },
                "object": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 0
                    },
                    "end": {
                      "line": 1,
                      "column": 4
                    }
                  },
                  "name": "Math"
                },
                "property": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 0
                    },
                    "end": {
                      "line": 1,
                      "column": 4
                    }
                  },
                  "name": "floor"
                },
                "computed": false
              },
              "arguments": [
                {
                  "type": "BinaryExpression",
                  "loc": {
                    "start": {
                      "line": 1,
                      "column": 0
                    },
                    "end": {
                      "line": 1,
                      "column": 4
                    }
                  },
                  "left": {
                    "type": "Literal",
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 1
                      }
                    },
                    "value": 5,
                    "raw": "5"
                  },
                  "operator": "/",
                  "right": {
                    "type": "Literal",
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 3
                      },
                      "end": {
                        "line": 1,
                        "column": 4
                      }
                    },
                    "value": 2,
                    "raw": "2"
                  }
                }
              ]
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("(x, y, z) = (1, 2, 3)", function () {
      var code = "(x, y, z) = (1, 2, 3)";
      var ast = util.parse(code, { locations: true });
      var expected =
      {
        "type": "Program",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 21
          }
        },
        "body": [
          {
            "type": "BlockStatement",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 1,
                "column": 21
              }
            },
            "body": [
              {
                "type": "VariableDeclaration",
    
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 12
                  },
                  "end": {
                    "line": 1,
                    "column": 21
                  }
                },
                "kind": "var",
                "declarations": [
                  {
                    "type": "VariableDeclarator",
        
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 12
                      },
                      "end": {
                        "line": 1,
                        "column": 21
                      }
                    },
                    "id": {
                      "type": "Identifier",
          
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 12
                        },
                        "end": {
                          "line": 1,
                          "column": 21
                        }
                      },
                      "name": "__filbertTmp0"
                    },
                    "init": {
                      "type": "NewExpression",
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 12
                        },
                        "end": {
                          "line": 1,
                          "column": 21
                        }
                      },
                      "arguments": [
                        {
                          "type": "Literal",
                          "loc": {
                            "start": {
                              "line": 1,
                              "column": 13
                            },
                            "end": {
                              "line": 1,
                              "column": 14
                            }
                          },
                          "value": 1,
                          "raw": "1"
                        },
                        {
                          "type": "Literal",
                          "loc": {
                            "start": {
                              "line": 1,
                              "column": 16
                            },
                            "end": {
                              "line": 1,
                              "column": 17
                            }
                          },
                          "value": 2,
                          "raw": "2"
                        },
                        {
                          "type": "Literal",
                          "loc": {
                            "start": {
                              "line": 1,
                              "column": 19
                            },
                            "end": {
                              "line": 1,
                              "column": 20
                            }
                          },
                          "value": 3,
                          "raw": "3"
                        }
                      ],
                      "callee": {
                        "type": "MemberExpression",
            
                        "loc": {
                          "start": {
                            "line": 1,
                            "column": 13
                          },
                          "end": {
                            "line": 1,
                            "column": 20
                          }
                        },
                        "object": {
                          "type": "MemberExpression",
              
                          "loc": {
                            "start": {
                              "line": 1,
                              "column": 13
                            },
                            "end": {
                              "line": 1,
                              "column": 20
                            }
                          },
                          "object": {
                            "type": "Identifier",
                
                            "loc": {
                              "start": {
                                "line": 1,
                                "column": 13
                              },
                              "end": {
                                "line": 1,
                                "column": 20
                              }
                            },
                            "name": "__pythonRuntime"
                          },
                          "property": {
                            "type": "Identifier",
                
                            "loc": {
                              "start": {
                                "line": 1,
                                "column": 13
                              },
                              "end": {
                                "line": 1,
                                "column": 20
                              }
                            },
                            "name": "objects"
                          },
                          "computed": false
                        },
                        "property": {
                          "type": "Identifier",
              
                          "loc": {
                            "start": {
                              "line": 1,
                              "column": 13
                            },
                            "end": {
                              "line": 1,
                              "column": 20
                            }
                          },
                          "name": "tuple"
                        },
                        "computed": false
                      }
                    }
                  }
                ]
              },
              {
                "type": "VariableDeclaration",
    
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 1
                  },
                  "end": {
                    "line": 1,
                    "column": 2
                  }
                },
                "kind": "var",
                "declarations": [
                  {
                    "type": "VariableDeclarator",
        
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 1
                      },
                      "end": {
                        "line": 1,
                        "column": 2
                      }
                    },
                    "id": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 1
                        },
                        "end": {
                          "line": 1,
                          "column": 2
                        }
                      },
                      "name": "x"
                    },
                    "init": {
                      "type": "MemberExpression",
          
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 12
                        },
                        "end": {
                          "line": 1,
                          "column": 21
                        }
                      },
                      "object": {
                        "type": "Identifier",
            
                        "loc": {
                          "start": {
                            "line": 1,
                            "column": 12
                          },
                          "end": {
                            "line": 1,
                            "column": 21
                          }
                        },
                        "name": "__filbertTmp0"
                      },
                      "property": {
                        "type": "Literal",
            
                        "loc": {
                          "start": {
                            "line": 1,
                            "column": 12
                          },
                          "end": {
                            "line": 1,
                            "column": 21
                          }
                        },
                        "value": 0
                      },
                      "computed": true
                    }
                  }
                ]
              },
              {
                "type": "VariableDeclaration",
    
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 4
                  },
                  "end": {
                    "line": 1,
                    "column": 5
                  }
                },
                "kind": "var",
                "declarations": [
                  {
                    "type": "VariableDeclarator",
        
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 4
                      },
                      "end": {
                        "line": 1,
                        "column": 5
                      }
                    },
                    "id": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 4
                        },
                        "end": {
                          "line": 1,
                          "column": 5
                        }
                      },
                      "name": "y"
                    },
                    "init": {
                      "type": "MemberExpression",
          
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 12
                        },
                        "end": {
                          "line": 1,
                          "column": 21
                        }
                      },
                      "object": {
                        "type": "Identifier",
            
                        "loc": {
                          "start": {
                            "line": 1,
                            "column": 12
                          },
                          "end": {
                            "line": 1,
                            "column": 21
                          }
                        },
                        "name": "__filbertTmp0"
                      },
                      "property": {
                        "type": "Literal",
            
                        "loc": {
                          "start": {
                            "line": 1,
                            "column": 12
                          },
                          "end": {
                            "line": 1,
                            "column": 21
                          }
                        },
                        "value": 1
                      },
                      "computed": true
                    }
                  }
                ]
              },
              {
                "type": "VariableDeclaration",
    
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 7
                  },
                  "end": {
                    "line": 1,
                    "column": 8
                  }
                },
                "kind": "var",
                "declarations": [
                  {
                    "type": "VariableDeclarator",
        
                    "loc": {
                      "start": {
                        "line": 1,
                        "column": 7
                      },
                      "end": {
                        "line": 1,
                        "column": 8
                      }
                    },
                    "id": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 7
                        },
                        "end": {
                          "line": 1,
                          "column": 8
                        }
                      },
                      "name": "z"
                    },
                    "init": {
                      "type": "MemberExpression",
          
                      "loc": {
                        "start": {
                          "line": 1,
                          "column": 12
                        },
                        "end": {
                          "line": 1,
                          "column": 21
                        }
                      },
                      "object": {
                        "type": "Identifier",
            
                        "loc": {
                          "start": {
                            "line": 1,
                            "column": 12
                          },
                          "end": {
                            "line": 1,
                            "column": 21
                          }
                        },
                        "name": "__filbertTmp0"
                      },
                      "property": {
                        "type": "Literal",
            
                        "loc": {
                          "start": {
                            "line": 1,
                            "column": 12
                          },
                          "end": {
                            "line": 1,
                            "column": 21
                          }
                        },
                        "value": 2
                      },
                      "computed": true
                    }
                  }
                ]
              }
            ]
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

  });

  describe("index-based ranges", function () {
    it("x = 5", function () {
      var code = "x = 5";
      var ast = util.parse(code, { ranges: true });
      expect(ast.range).toEqual([0, 5]);
      expect(ast.body[0].range).toEqual([0, 1]);
      expect(ast.body[0].declarations[0].range).toEqual([0, 1]);
      expect(ast.body[0].declarations[0].id.range).toEqual([0, 1]);
      expect(ast.body[0].declarations[0].id.name).toEqual('x');
      expect(ast.body[0].declarations[0].init.range).toEqual([4, 5]);
      expect(ast.body[0].declarations[0].init.value).toEqual(5);
    });

    it("function call", function () {
      var code = "foo(a, b)";
      var ast = util.parse(code, { ranges: true });
      var expected =
      {
        "type": "Program",
        "range": [
          0,
          9
        ],
        "body": [
          {
            "type": "ExpressionStatement",
            "range": [
              0,
              9
            ],
            "expression": {
              "type": "CallExpression",
              "range": [
                0,
                9
              ],
              "arguments": [
                {
                  "type": "Identifier",
                  "range": [
                    4,
                    5
                  ],
                  "name": "a"
                },
                {
                  "type": "Identifier",
                  "range": [
                    7,
                    8
                  ],
                  "name": "b"
                }
              ],
              "callee": {
                "type": "Identifier",
                "range": [
                  0,
                  3
                ],
                "name": "foo"
              }
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("function def", function () {
      var code = "def add(a, b):\n	r = a + b\n return r\n";
      var ast = util.parse(code, { ranges: true });
      var expected =
      {
        "type": "Program",
        "range": [
          0,
          36
        ],
        "body": [
          {
            "type": "FunctionDeclaration",
            "range": [
              0,
              36
            ],
            "id": {
              "type": "Identifier",
              "range": [
                4,
                7
              ],
              "name": "add"
            },
            "params": [],
            "body": {
              "type": "BlockStatement",
              "range": [
                14,
                36
              ],
              "body": [
                {
                  "type": "VariableDeclaration",
                  "range": [
                    4,
                    7
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "range": [
                        4,
                        7
                      ],
                      "id": {
                        "type": "Identifier",
                        "range": [
                          4,
                          7
                        ],
                        "name": "__params0"
                      },
                      "init": {
                        "type": "ConditionalExpression",
                        "range": [
                          4,
                          7
                        ],
                        "test": {
                          "type": "LogicalExpression",
                          "range": [
                            4,
                            7
                          ],
                          "operator": "&&",
                          "left": {
                            "type": "LogicalExpression",
                            "range": [
                              4,
                              7
                            ],
                            "operator": "&&",
                            "left": {
                              "type": "BinaryExpression",
                              "range": [
                                4,
                                7
                              ],
                              "operator": "===",
                              "left": {
                                "type": "MemberExpression",
                                "range": [
                                  4,
                                  7
                                ],
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "name": "length"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "range": [
                                  4,
                                  7
                                ],
                                "value": 1
                              }
                            },
                            "right": {
                              "type": "MemberExpression",
                              "range": [
                                4,
                                7
                              ],
                              "computed": false,
                              "object": {
                                "type": "MemberExpression",
                                "range": [
                                  4,
                                  7
                                ],
                                "computed": true,
                                "object": {
                                  "type": "Identifier",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Literal",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "value": 0
                                }
                              },
                              "property": {
                                "type": "Identifier",
                                "range": [
                                  4,
                                  7
                                ],
                                "name": "formals"
                              }
                            }
                          },
                          "right": {
                            "type": "MemberExpression",
                            "range": [
                              4,
                              7
                            ],
                            "computed": false,
                            "object": {
                              "type": "MemberExpression",
                              "range": [
                                4,
                                7
                              ],
                              "computed": true,
                              "object": {
                                "type": "Identifier",
                                "range": [
                                  4,
                                  7
                                ],
                                "name": "arguments"
                              },
                              "property": {
                                "type": "Literal",
                                "range": [
                                  4,
                                  7
                                ],
                                "value": 0
                              }
                            },
                            "property": {
                              "type": "Identifier",
                              "range": [
                                4,
                                7
                              ],
                              "name": "keywords"
                            }
                          }
                        },
                        "consequent": {
                          "type": "MemberExpression",
                          "range": [
                            4,
                            7
                          ],
                          "computed": true,
                          "object": {
                            "type": "Identifier",
                            "range": [
                              4,
                              7
                            ],
                            "name": "arguments"
                          },
                          "property": {
                            "type": "Literal",
                            "range": [
                              4,
                              7
                            ],
                            "value": 0
                          }
                        },
                        "alternate": {
                          "type": "Literal",
                          "range": [
                            4,
                            7
                          ],
                          "value": null
                        }
                      }
                    }
                  ]
                },
                {
                  "type": "VariableDeclaration",
                  "range": [
                    4,
                    7
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "range": [
                        4,
                        7
                      ],
                      "id": {
                        "type": "Identifier",
                        "range": [
                          4,
                          7
                        ],
                        "name": "__formalsIndex0"
                      },
                      "init": {
                        "type": "Literal",
                        "range": [
                          4,
                          7
                        ],
                        "value": 0
                      }
                    }
                  ]
                },
                {
                  "type": "VariableDeclaration",
                  "range": [
                    4,
                    7
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "range": [
                        4,
                        7
                      ],
                      "id": {
                        "type": "Identifier",
                        "range": [
                          4,
                          7
                        ],
                        "name": "__args0"
                      },
                      "init": {
                        "type": "Identifier",
                        "range": [
                          4,
                          7
                        ],
                        "name": "arguments"
                      }
                    }
                  ]
                },
                {
                  "type": "FunctionDeclaration",
                  "range": [
                    4,
                    7
                  ],
                  "id": {
                    "type": "Identifier",
                    "range": [
                      4,
                      7
                    ],
                    "name": "__getParam0"
                  },
                  "params": [
                    {
                      "type": "Identifier",
                      "range": [
                        4,
                        7
                      ],
                      "name": "v"
                    },
                    {
                      "type": "Identifier",
                      "range": [
                        4,
                        7
                      ],
                      "name": "d"
                    }
                  ],
                  "defaults": [],
                  "body": {
                    "type": "BlockStatement",
                    "range": [
                      4,
                      7
                    ],
                    "body": [
                      {
                        "type": "VariableDeclaration",
                        "range": [
                          4,
                          7
                        ],
                        "kind": "var",
                        "declarations": [
                          {
                            "type": "VariableDeclarator",
                            "range": [
                              4,
                              7
                            ],
                            "id": {
                              "type": "Identifier",
                              "range": [
                                4,
                                7
                              ],
                              "name": "r"
                            },
                            "init": {
                              "type": "Identifier",
                              "range": [
                                4,
                                7
                              ],
                              "name": "d"
                            }
                          }
                        ]
                      },
                      {
                        "type": "IfStatement",
                        "range": [
                          4,
                          7
                        ],
                        "test": {
                          "type": "Identifier",
                          "range": [
                            4,
                            7
                          ],
                          "name": "__params0"
                        },
                        "consequent": {
                          "type": "BlockStatement",
                          "range": [
                            4,
                            7
                          ],
                          "body": [
                            {
                              "type": "IfStatement",
                              "range": [
                                4,
                                7
                              ],
                              "test": {
                                "type": "BinaryExpression",
                                "range": [
                                  4,
                                  7
                                ],
                                "operator": "<",
                                "left": {
                                  "type": "Identifier",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "name": "__formalsIndex0"
                                },
                                "right": {
                                  "type": "MemberExpression",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "computed": false,
                                  "object": {
                                    "type": "MemberExpression",
                                    "range": [
                                      4,
                                      7
                                    ],
                                    "computed": false,
                                    "object": {
                                      "type": "Identifier",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "name": "__params0"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "name": "formals"
                                    }
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "range": [
                                      4,
                                      7
                                    ],
                                    "name": "length"
                                  }
                                }
                              },
                              "consequent": {
                                "type": "BlockStatement",
                                "range": [
                                  4,
                                  7
                                ],
                                "body": [
                                  {
                                    "type": "ExpressionStatement",
                                    "range": [
                                      4,
                                      7
                                    ],
                                    "expression": {
                                      "type": "AssignmentExpression",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "operator": "=",
                                      "left": {
                                        "type": "Identifier",
                                        "range": [
                                          4,
                                          7
                                        ],
                                        "name": "r"
                                      },
                                      "right": {
                                        "type": "MemberExpression",
                                        "range": [
                                          4,
                                          7
                                        ],
                                        "computed": true,
                                        "object": {
                                          "type": "MemberExpression",
                                          "range": [
                                            4,
                                            7
                                          ],
                                          "computed": false,
                                          "object": {
                                            "type": "Identifier",
                                            "range": [
                                              4,
                                              7
                                            ],
                                            "name": "__params0"
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "range": [
                                              4,
                                              7
                                            ],
                                            "name": "formals"
                                          }
                                        },
                                        "property": {
                                          "type": "UpdateExpression",
                                          "range": [
                                            4,
                                            7
                                          ],
                                          "operator": "++",
                                          "argument": {
                                            "type": "Identifier",
                                            "range": [
                                              4,
                                              7
                                            ],
                                            "name": "__formalsIndex0"
                                          },
                                          "prefix": false
                                        }
                                      }
                                    }
                                  }
                                ]
                              },
                              "alternate": {
                                "type": "IfStatement",
                                "range": [
                                  4,
                                  7
                                ],
                                "test": {
                                  "type": "BinaryExpression",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "operator": "in",
                                  "left": {
                                    "type": "Identifier",
                                    "range": [
                                      4,
                                      7
                                    ],
                                    "name": "v"
                                  },
                                  "right": {
                                    "type": "MemberExpression",
                                    "range": [
                                      4,
                                      7
                                    ],
                                    "computed": false,
                                    "object": {
                                      "type": "Identifier",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "name": "__params0"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "name": "keywords"
                                    }
                                  }
                                },
                                "consequent": {
                                  "type": "BlockStatement",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "body": [
                                    {
                                      "type": "ExpressionStatement",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "expression": {
                                        "type": "AssignmentExpression",
                                        "range": [
                                          4,
                                          7
                                        ],
                                        "operator": "=",
                                        "left": {
                                          "type": "Identifier",
                                          "range": [
                                            4,
                                            7
                                          ],
                                          "name": "r"
                                        },
                                        "right": {
                                          "type": "MemberExpression",
                                          "range": [
                                            4,
                                            7
                                          ],
                                          "computed": true,
                                          "property": {
                                            "type": "Identifier",
                                            "range": [
                                              4,
                                              7
                                            ],
                                            "name": "v"
                                          },
                                          "object": {
                                            "type": "MemberExpression",
                                            "range": [
                                              4,
                                              7
                                            ],
                                            "computed": false,
                                            "object": {
                                              "type": "Identifier",
                                              "range": [
                                                4,
                                                7
                                              ],
                                              "name": "__params0"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "range": [
                                                4,
                                                7
                                              ],
                                              "name": "keywords"
                                            }
                                          }
                                        }
                                      }
                                    },
                                    {
                                      "type": "ExpressionStatement",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "expression": {
                                        "type": "UnaryExpression",
                                        "range": [
                                          4,
                                          7
                                        ],
                                        "operator": "delete",
                                        "prefix": true,
                                        "argument": {
                                          "type": "MemberExpression",
                                          "range": [
                                            4,
                                            7
                                          ],
                                          "computed": true,
                                          "property": {
                                            "type": "Identifier",
                                            "range": [
                                              4,
                                              7
                                            ],
                                            "name": "v"
                                          },
                                          "object": {
                                            "type": "MemberExpression",
                                            "range": [
                                              4,
                                              7
                                            ],
                                            "computed": false,
                                            "object": {
                                              "type": "Identifier",
                                              "range": [
                                                4,
                                                7
                                              ],
                                              "name": "__params0"
                                            },
                                            "property": {
                                              "type": "Identifier",
                                              "range": [
                                                4,
                                                7
                                              ],
                                              "name": "keywords"
                                            }
                                          }
                                        }
                                      }
                                    }
                                  ]
                                },
                                "alternate": null
                              }
                            }
                          ]
                        },
                        "alternate": {
                          "type": "IfStatement",
                          "range": [
                            4,
                            7
                          ],
                          "test": {
                            "type": "BinaryExpression",
                            "range": [
                              4,
                              7
                            ],
                            "operator": "<",
                            "left": {
                              "type": "Identifier",
                              "range": [
                                4,
                                7
                              ],
                              "name": "__formalsIndex0"
                            },
                            "right": {
                              "type": "MemberExpression",
                              "range": [
                                4,
                                7
                              ],
                              "computed": false,
                              "object": {
                                "type": "Identifier",
                                "range": [
                                  4,
                                  7
                                ],
                                "name": "__args0"
                              },
                              "property": {
                                "type": "Identifier",
                                "range": [
                                  4,
                                  7
                                ],
                                "name": "length"
                              }
                            }
                          },
                          "consequent": {
                            "type": "BlockStatement",
                            "range": [
                              4,
                              7
                            ],
                            "body": [
                              {
                                "type": "ExpressionStatement",
                                "range": [
                                  4,
                                  7
                                ],
                                "expression": {
                                  "type": "AssignmentExpression",
                                  "range": [
                                    4,
                                    7
                                  ],
                                  "operator": "=",
                                  "left": {
                                    "type": "Identifier",
                                    "range": [
                                      4,
                                      7
                                    ],
                                    "name": "r"
                                  },
                                  "right": {
                                    "type": "MemberExpression",
                                    "range": [
                                      4,
                                      7
                                    ],
                                    "computed": true,
                                    "object": {
                                      "type": "Identifier",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "name": "__args0"
                                    },
                                    "property": {
                                      "type": "UpdateExpression",
                                      "range": [
                                        4,
                                        7
                                      ],
                                      "operator": "++",
                                      "argument": {
                                        "type": "Identifier",
                                        "range": [
                                          4,
                                          7
                                        ],
                                        "name": "__formalsIndex0"
                                      },
                                      "prefix": false
                                    }
                                  }
                                }
                              }
                            ]
                          },
                          "alternate": null
                        }
                      },
                      {
                        "type": "ReturnStatement",
                        "range": [
                          4,
                          7
                        ],
                        "argument": {
                          "type": "Identifier",
                          "range": [
                            4,
                            7
                          ],
                          "name": "r"
                        }
                      }
                    ]
                  },
                  "rest": null,
                  "generator": false,
                  "expression": false
                },
                {
                  "type": "VariableDeclaration",
                  "range": [
                    8,
                    9
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "range": [
                        8,
                        9
                      ],
                      "id": {
                        "type": "Identifier",
                        "range": [
                          8,
                          9
                        ],
                        "name": "a"
                      },
                      "init": {
                        "type": "CallExpression",
                        "range": [
                          8,
                          9
                        ],
                        "callee": {
                          "type": "Identifier",
                          "range": [
                            8,
                            9
                          ],
                          "name": "__getParam0"
                        },
                        "arguments": [
                          {
                            "type": "Literal",
                            "range": [
                              8,
                              9
                            ],
                            "value": "a"
                          }
                        ]
                      }
                    }
                  ]
                },
                {
                  "type": "VariableDeclaration",
                  "range": [
                    11,
                    12
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "range": [
                        11,
                        12
                      ],
                      "id": {
                        "type": "Identifier",
                        "range": [
                          11,
                          12
                        ],
                        "name": "b"
                      },
                      "init": {
                        "type": "CallExpression",
                        "range": [
                          11,
                          12
                        ],
                        "callee": {
                          "type": "Identifier",
                          "range": [
                            11,
                            12
                          ],
                          "name": "__getParam0"
                        },
                        "arguments": [
                          {
                            "type": "Literal",
                            "range": [
                              11,
                              12
                            ],
                            "value": "b"
                          }
                        ]
                      }
                    }
                  ]
                },
                {
                  "type": "ReturnStatement",
                  "range": [
                    14,
                    36
                  ],
                  "argument": {
                    "type": "CallExpression",
                    "range": [
                      14,
                      36
                    ],
                    "callee": {
                      "type": "MemberExpression",
                      "range": [
                        14,
                        36
                      ],
                      "computed": false,
                      "object": {
                        "type": "FunctionExpression",
                        "range": [
                          14,
                          36
                        ],
                        "params": [],
                        "defaults": [],
                        "body": {
                          "type": "BlockStatement",
                          "range": [
                            14,
                            36
                          ],
                          "body": [
                            {
                              "type": "VariableDeclaration",
                              "range": [
                                16,
                                17
                              ],
                              "kind": "var",
                              "declarations": [
                                {
                                  "type": "VariableDeclarator",
                                  "range": [
                                    16,
                                    17
                                  ],
                                  "id": {
                                    "type": "Identifier",
                                    "range": [
                                      16,
                                      17
                                    ],
                                    "name": "r"
                                  },
                                  "init": {
                                    "type": "CallExpression",
                                    "range": [
                                      20,
                                      25
                                    ],
                                    "arguments": [
                                      {
                                        "type": "Identifier",
                                        "range": [
                                          20,
                                          21
                                        ],
                                        "name": "a"
                                      },
                                      {
                                        "type": "Identifier",
                                        "range": [
                                          24,
                                          25
                                        ],
                                        "name": "b"
                                      }
                                    ],
                                    "callee": {
                                      "type": "MemberExpression",
                                      "range": [
                                        20,
                                        25
                                      ],
                                      "object": {
                                        "type": "MemberExpression",
                                        "range": [
                                          20,
                                          25
                                        ],
                                        "object": {
                                          "type": "Identifier",
                                          "range": [
                                            20,
                                            25
                                          ],
                                          "name": "__pythonRuntime"
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "range": [
                                            20,
                                            25
                                          ],
                                          "name": "ops"
                                        },
                                        "computed": false
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "range": [
                                          20,
                                          25
                                        ],
                                        "name": "add"
                                      },
                                      "computed": false
                                    }
                                  }
                                }
                              ]
                            },
                            {
                              "type": "ReturnStatement",
                              "range": [
                                27,
                                35
                              ],
                              "argument": {
                                "type": "Identifier",
                                "range": [
                                  34,
                                  35
                                ],
                                "name": "r"
                              }
                            }
                          ]
                        },
                        "generator": false,
                        "expression": false
                      },
                      "property": {
                        "type": "Identifier",
                        "range": [
                          14,
                          36
                        ],
                        "name": "call"
                      }
                    },
                    "arguments": [
                      {
                        "type": "ThisExpression",
                        "range": [
                          14,
                          36
                        ]
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("list", function () {
      var code = "x = [5, 32, 1, 9]";
      var ast = util.parse(code, { ranges: true });
      var expected =
      {
        "type": "Program",
        "range": [
          0,
          17
        ],
        "body": [
          {
            "type": "VariableDeclaration",
            "range": [
              0,
              1
            ],
            "kind": "var",
            "declarations": [
              {
                "type": "VariableDeclarator",
                "range": [
                  0,
                  1
                ],
                "id": {
                  "type": "Identifier",
                  "range": [
                    0,
                    1
                  ],
                  "name": "x"
                },
                "init": {
                  "type": "NewExpression",
                  "range": [
                    4,
                    17
                  ],
                  "arguments": [
                    {
                      "type": "Literal",
                      "range": [
                        5,
                        6
                      ],
                      "value": 5,
                      "raw": "5"
                    },
                    {
                      "type": "Literal",
                      "range": [
                        8,
                        10
                      ],
                      "value": 32,
                      "raw": "32"
                    },
                    {
                      "type": "Literal",
                      "range": [
                        12,
                        13
                      ],
                      "value": 1,
                      "raw": "1"
                    },
                    {
                      "type": "Literal",
                      "range": [
                        15,
                        16
                      ],
                      "value": 9,
                      "raw": "9"
                    }
                  ],
                  "callee": {
                    "type": "MemberExpression",
        
                    "range": [
                      4,
                      17
                    ],
                    "object": {
                      "type": "MemberExpression",
          
                      "range": [
                        4,
                        17
                      ],
                      "object": {
                        "type": "Identifier",
            
                        "range": [
                          4,
                          17
                        ],
                        "name": "__pythonRuntime"
                      },
                      "property": {
                        "type": "Identifier",
            
                        "range": [
                          4,
                          17
                        ],
                        "name": "objects"
                      },
                      "computed": false
                    },
                    "property": {
                      "type": "Identifier",
          
                      "range": [
                        4,
                        17
                      ],
                      "name": "list"
                    },
                    "computed": false
                  }
                }
              }
            ]
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("dictionary", function () {
      var code = "d = {'p1':'prop1', 'p2':'prop2'}\nprint(d['p1'])";
      var ast = util.parse(code, { ranges: true });
      var expected =
      {
        "type": "Program",
        "range": [
          0,
          47
        ],
        "body": [
          {
            "type": "VariableDeclaration",
            "range": [
              0,
              1
            ],
            "kind": "var",
            "declarations": [
              {
                "type": "VariableDeclarator",
                "range": [
                  0,
                  1
                ],
                "id": {
                  "type": "Identifier",
                  "range": [
                    0,
                    1
                  ],
                  "name": "d"
                },
                "init": {
                  "type": "NewExpression",
                  "range": [
                    4,
                    32
                  ],
                  "arguments": [
                    {
                      "type": "ArrayExpression",
                      "range": [
                        5,
                        17
                      ],
                      "elements": [
                        {
                          "type": "Literal",
                          "range": [
                            5,
                            9
                          ],
                          "value": "p1",
                          "raw": "'p1'"
                        },
                        {
                          "type": "Literal",
                          "range": [
                            10,
                            17
                          ],
                          "value": "prop1",
                          "raw": "'prop1'"
                        }
                      ]
                    },
                    {
                      "type": "ArrayExpression",
                      "range": [
                        19,
                        31
                      ],
                      "elements": [
                        {
                          "type": "Literal",
                          "range": [
                            19,
                            23
                          ],
                          "value": "p2",
                          "raw": "'p2'"
                        },
                        {
                          "type": "Literal",
                          "range": [
                            24,
                            31
                          ],
                          "value": "prop2",
                          "raw": "'prop2'"
                        }
                      ]
                    }
                  ],
                  "callee": {
                    "type": "MemberExpression",
                    "range": [
                      4,
                      32
                    ],
                    "object": {
                      "type": "MemberExpression",
                      "range": [
                        4,
                        32
                      ],
                      "object": {
                        "type": "Identifier",
                        "range": [
                          4,
                          32
                        ],
                        "name": "__pythonRuntime"
                      },
                      "property": {
                        "type": "Identifier",
                        "range": [
                          4,
                          32
                        ],
                        "name": "objects"
                      },
                      "computed": false
                    },
                    "property": {
                      "type": "Identifier",
                      "range": [
                        4,
                        32
                      ],
                      "name": "dict"
                    },
                    "computed": false
                  }
                }
              }
            ]
          },
          {
            "type": "ExpressionStatement",
            "range": [
              33,
              47
            ],
            "expression": {
              "type": "CallExpression",
              "range": [
                33,
                47
              ],
              "arguments": [
                {
                  "type": "MemberExpression",
                  "range": [
                    39,
                    46
                  ],
                  "object": {
                    "type": "Identifier",
                    "range": [
                      39,
                      40
                    ],
                    "name": "d"
                  },
                  "property": {
                    "type": "CallExpression",
                    "range": [
                      41,
                      45
                    ],
                    "callee": {
                      "type": "MemberExpression",
                      "range": [
                        41,
                        45
                      ],
                      "object": {
                        "type": "MemberExpression",
                        "range": [
                          41,
                          45
                        ],
                        "object": {
                          "type": "Identifier",
                          "range": [
                            41,
                            45
                          ],
                          "name": "__pythonRuntime"
                        },
                        "property": {
                          "type": "Identifier",
                          "range": [
                            41,
                            45
                          ],
                          "name": "ops"
                        },
                        "computed": false
                      },
                      "property": {
                        "type": "Identifier",
                        "range": [
                          41,
                          45
                        ],
                        "name": "subscriptIndex"
                      },
                      "computed": false
                    },
                    "arguments": [
                      {
                        "type": "Identifier",
                        "range": [
                          39,
                          40
                        ],
                        "name": "d"
                      },
                      {
                        "type": "Literal",
                        "range": [
                          41,
                          45
                        ],
                        "value": "p1",
                        "raw": "'p1'"
                      }
                    ]
                  },
                  "computed": true
                }
              ],
              "callee": {
                "type": "MemberExpression",
                "range": [
                  33,
                  38
                ],
                "object": {
                  "type": "MemberExpression",
                  "range": [
                    33,
                    38
                  ],
                  "object": {
                    "type": "Identifier",
                    "range": [
                      33,
                      38
                    ],
                    "name": "__pythonRuntime"
                  },
                  "property": {
                    "type": "Identifier",
                    "range": [
                      33,
                      38
                    ],
                    "name": "functions"
                  },
                  "computed": false
                },
                "property": {
                  "type": "Identifier",
                  "range": [
                    33,
                    38
                  ],
                  "name": "print"
                },
                "computed": false
              }
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("x in y", function () {
      var code = "x in y";
      var ast = util.parse(code, { ranges: true });
      var expected =
      {
        "type": "Program",
        "range": [
          0,
          6
        ],
        "body": [
          {
            "type": "ExpressionStatement",
            "range": [
              0,
              6
            ],
            "expression": {
              "type": "CallExpression",
              "range": [
                0,
                6
              ],
              "callee": {
                "type": "MemberExpression",
                "range": [
                  0,
                  6
                ],
                "computed": false,
                "object": {
                  "type": "MemberExpression",
                  "range": [
                    0,
                    6
                  ],
                  "computed": false,
                  "object": {
                    "type": "Identifier",
                    "range": [
                      0,
                      6
                    ],
                    "name": "__pythonRuntime"
                  },
                  "property": {
                    "type": "Identifier",
                    "range": [
                      0,
                      6
                    ],
                    "name": "ops"
                  }
                },
                "property": {
                  "type": "Identifier",
                  "range": [
                    0,
                    6
                  ],
                  "name": "in"
                }
              },
              "arguments": [
                {
                  "type": "Identifier",
                  "range": [
                    0,
                    1
                  ],
                  "name": "x"
                },
                {
                  "type": "Identifier",
                  "range": [
                    5,
                    6
                  ],
                  "name": "y"
                },
                {
                  "type": "Literal",
                  "range": [
                    0,
                    6
                  ],
                  "value": false
                }
              ]
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });

    it("x not in y", function () {
      var code = "x not in y";
      var ast = util.parse(code, { ranges: true });
      var expected =
      {
        "type": "Program",
        "range": [
          0,
          10
        ],
        "body": [
          {
            "type": "ExpressionStatement",
            "range": [
              0,
              10
            ],
            "expression": {
              "type": "CallExpression",
              "range": [
                0,
                10
              ],
              "callee": {
                "type": "MemberExpression",
                "range": [
                  0,
                  10
                ],
                "computed": false,
                "object": {
                  "type": "MemberExpression",
                  "range": [
                    0,
                    10
                  ],
                  "computed": false,
                  "object": {
                    "type": "Identifier",
                    "range": [
                      0,
                      10
                    ],
                    "name": "__pythonRuntime"
                  },
                  "property": {
                    "type": "Identifier",
                    "range": [
                      0,
                      10
                    ],
                    "name": "ops"
                  }
                },
                "property": {
                  "type": "Identifier",
                  "range": [
                    0,
                    10
                  ],
                  "name": "in"
                }
              },
              "arguments": [
                {
                  "type": "Identifier",
                  "range": [
                    0,
                    1
                  ],
                  "name": "x"
                },
                {
                  "type": "Identifier",
                  "range": [
                    9,
                    10
                  ],
                  "name": "y"
                },
                {
                  "type": "Literal",
                  "range": [
                    0,
                    10
                  ],
                  "value": true
                }
              ]
            }
          }
        ]
      };
      var mis = misMatch(expected, ast);
      expect(mis).toBeUndefined();
    });
  });
});