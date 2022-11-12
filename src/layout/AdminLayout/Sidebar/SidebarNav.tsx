import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines, faStar, IconDefinition } from '@fortawesome/free-regular-svg-icons'
import { faCalculator, faCode, faPencil } from '@fortawesome/free-solid-svg-icons'
import React, { PropsWithChildren } from 'react'
import { Nav } from 'react-bootstrap'
import Link from 'next/link'

type SidebarNavItemProps = {
  href: string;
  icon?: IconDefinition;
} & PropsWithChildren

const SidebarNavItem = (props: SidebarNavItemProps) => {
  const {
    icon,
    children,
    href,
  } = props

  return (
    <Nav.Item>
      <Link href={href} passHref legacyBehavior>
        <Nav.Link className="px-3 py-2 d-flex align-items-center">
          {icon ? <FontAwesomeIcon className="nav-icon ms-n3" icon={icon} />
            : <span className="nav-icon ms-n3" />}
          {children}
        </Nav.Link>
      </Link>
    </Nav.Item>
  )
}

export default function SidebarNav() {
  return (
    <ul className="list-unstyled">
      <SidebarNavItem icon={faStar} href="home">Home</SidebarNavItem>
      <SidebarNavItem icon={faFileLines} href="getting_started">Getting Started</SidebarNavItem>
      <SidebarNavItem icon={faCalculator} href="leaderboard">Leaderboard</SidebarNavItem>
      <SidebarNavItem icon={faCode} href="submissions">Submissions</SidebarNavItem>
      <SidebarNavItem icon={faPencil} href="scrimmages">Scrimmages</SidebarNavItem>
    </ul>
  )
}
