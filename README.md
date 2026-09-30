# Workflow Centralization Tool

Tampermonkey userscript that opens all the tools needed to investigate an item from one ID.

**Role context:** Risk Management & Quality Operations Project

## Problem
Investigating one item meant opening about a dozen tools one by one and pasting the same ID
into each, on every case.

## Solution
- First version: a browser extension (Simple Select and Search) that opened the common tools in two clicks.
- Current version: a Tampermonkey script with all required links built in.
  Enter the item ID and every tool opens with one click.
- Detects the ID from the current page when possible and fills it in on the target tool.

## Result
- Two clicks became one, and the ID no longer had to be copied by hand.
- **[COMPLETAR: tiempo por caso antes y después, o cuántos casos por día. Si no lo mediste, borra esta línea.]**

## Built with
JavaScript, Tampermonkey. Developed with AI assistance.

## Note
This public file is a sanitized skeleton: the interface is a placeholder and every URL is an
example, so internal tools are not exposed.
