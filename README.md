# Soft sync

A system for syncing software and their settings.
Mainly aimed towards linux systems.

In essence this can be seen as private package manager wrapper that will install software for you. It wraps and extends existing package managers by also making sure that the correct settings are installed.

The managed settings can be configured by multiple software configurations. i.e. a file can be extended by another software if desired.

## Config

Config is borken into 2 different types, `Software` and `System`

### System
`System` is in essence a list of desired and installed applications. ex

```
name: arch laptop
manager:
  - PACMAN
  - AURUTILS
wanted:
  - aurutils
  - i3
  - urxvt
installed:
  - aurutils
  - urxvt
```

It specifies what package manager to wrap and what should be installed.

Currently only `PACMAN` and `AURUTILS` are tested and supported.

Based on the config soft-sync will install `i3` as it is missing from the `installed` list.

Worth mentioning that uninstalling software is not yet supported. i.e. removing from wanted will not have any effect other than the software no longer being managed.

### Software
`Software` can be configured in multiple ways.
In their most basic form they only specify what packages to use.

```
name: "OpenSCAD"
packages:
  - name: "openscad"
    alternatives:
      - name: "openscad"
        manager: PACMAN
```

They can also include configuration if needed, by adding this to the root
```
settings:
  - path: ~/.config/i3/config
    content: |-
      set $mod Mod4
      font pango:monospace 8
      floating_modifier $mod
```

If the settings file is to be modified by other software you can specify it like this

```
settings:
  - path: ~/.config/i3/config
    content: |-
      bindsym $mod+Return exec urxvt
    position:
      type: END
    when:
      installed:
        - i3
```
The setting will then be added to end of the file assuming that the dependency `i3` is in the wanted list.

If you have software that is more complex and not managed by a package manager. For example if you need to compile from scratch or simply just run a script to install you can do so by specifying an `install` object
```
install:
  - |-
    cd /tmp
    git clone https://aur.archlinux.org/aurutils.git
    cd aurutils
    chown -R munhunger ./
    makepkg -sir --noconfirm --skippgpcheck
```