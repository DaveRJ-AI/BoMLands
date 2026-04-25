# Schema Spec v2 — Chronology Aware

## Core Design Additions

This version adds chronology support so the map can be filtered by historical/geographic era.

## Chronology Periods

- jaredite
- pre_christ
- destruction
- post_christ

## New Concepts

### chronology
A metadata object describing which historical periods a record belongs to.

### overlap_group
Optional grouping key for locations that occupy roughly the same map space across periods.

### status_by_period
Period-specific condition of a location.

## Rule

Chronology is a filter layer, not a replacement for geography.

A location may:
- exist in multiple periods
- change status between periods
- overlap another location from a different civilization layer