/* Parser for the billing formulas in paas-billing's pricing plans.
 *
 * These are quite simple, so there's no need to go all the way to
 * real postgres to calculate them.
 *
 * Examples:
 *
 * `ceil(8280/3600) * 0.00685`
 * `(2 * 8280 * (2048/1024.0) * (0.01 / 3600)) * 0.40`
 */

Expression
  = head:Term tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, head);
    }

Term
  = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / Ceiling
  / Number

Number "number"
  = Int Fraction? { return parseFloat(text()); }

Fraction = "." [0-9]+
Int = "0" / ([1-9] [0-9]*)

Ceiling "ceil"
  = "ceil(" val:Expression ")" { return Math.ceil(val) }

_ "whitespace" = [ \t\n\r]*
