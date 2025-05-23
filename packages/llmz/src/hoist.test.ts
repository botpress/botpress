import { describe, it, expect } from 'vitest'

import { hoistTypings } from './hoist.js'

describe('hoist', () => {
  describe('types hoisting', () => {
    it('type hoisting across tools and objects works', async () => {
      const after = await hoistTypings(`
        type PersonWithId = { id: number; person: { name: string; age: number; } }

        declare const MyObject: {

        // ---------------- //
        //    Properties    //
        // ---------------- //

        someone: PersonWithId;
        someoneElse: { id: number; person: { name: string; age: number; } };
        readonly anOtherPerson: Optional<{ id: number; person: { name: string; age: number; } }>;
        
        personWithDifferentFormatting: {
          person: { name: string;
            age: number;
          };
          id: number;
        };

        personWithComments: {
          id: number;
          person: {
            // Name of the person
            name: string;
            // Age of the person
            age: number;
          };
        };

        // ---------------- //
        //       Tools      //
        // ---------------- //

        myTool(args: { children: Array<{ name: string; age: number }> }): { /* with comment */ abc: number };

        // Second tool
        MySecondTool(args: { children: Array<{ name: string; age: number }> }): { /* with comment */ abc: number };

        // 3rd Tool
        MyThirdTool(args: { children: Array<{ name: string; age: number }> }): { abc: number };

      }


        // ----------------------- //
        //       Global Tools      //
        // ----------------------- //

        declare function appendChildren(): { a: number; b: number; c: Array<{ name: string; age: number }> };
        declare function appendChildren2(): { a: number; b: number; c: Array<{ name: string; age: number }> };
        
        
      `)

      expect(after).toMatchInlineSnapshot(`
        "type MyObjectPersonWithDifferentFormattingPerson = {
          name: string
          age: number
        }
        type MyObjectMySecondToolArgs = {
          children: Array<MyObjectPersonWithDifferentFormattingPerson>
        }
        type AppendChildren2Output = {
          a: number
          b: number
          c: Array<MyObjectPersonWithDifferentFormattingPerson>
        }
        type MyObjectMySecondTool = {
          /* with comment */ abc: number
        }
        type PersonWithId = {
          id: number
          person: MyObjectPersonWithDifferentFormattingPerson
        }
        declare const MyObject: {
          // ---------------- //
          //    Properties    //
          // ---------------- //

          someone: PersonWithId
          someoneElse: PersonWithId
          readonly anOtherPerson: Optional<PersonWithId>
          personWithDifferentFormatting: {
            person: MyObjectPersonWithDifferentFormattingPerson
            id: number
          }
          personWithComments: PersonWithId

          // ---------------- //
          //       Tools      //
          // ---------------- //

          myTool(args: MyObjectMySecondToolArgs): MyObjectMySecondTool

          // Second tool
          MySecondTool(args: MyObjectMySecondToolArgs): MyObjectMySecondTool

          // 3rd Tool
          MyThirdTool(args: MyObjectMySecondToolArgs): MyObjectMySecondTool
        }

        // ----------------------- //
        //       Global Tools      //
        // ----------------------- //

        declare function appendChildren(): AppendChildren2Output
        declare function appendChildren2(): AppendChildren2Output"
      `)
    })
  })
})
