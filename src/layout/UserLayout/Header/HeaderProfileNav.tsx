import { Dropdown, Nav, NavItem } from 'react-bootstrap'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faPowerOff } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

type NavItemProps = {
  icon: IconDefinition
} & PropsWithChildren

const ProfileDropdownItem = (props: NavItemProps) => {
  const { icon, children } = props

  return (
    <>
      <FontAwesomeIcon className="me-2" icon={icon} fixedWidth />
      {children}
    </>
  )
}

export default function HeaderProfileNav() {
  const router = useRouter()
  const logout = async () => {
    await signOut()
  }

  return (
    <Nav>
      <Dropdown as={NavItem}>
        <Dropdown.Toggle
          variant="link"
          bsPrefix="shadow-none"
          className="py-0 px-2 rounded-0"
          id="dropdown-profile"
        >
          <div className="avatar position-relative">
            <Image
              fill
              className="rounded-circle"
              src="/assets/img/avatars/default.png"
              alt="user@email.com"
            />
          </div>
        </Dropdown.Toggle>
        <Dropdown.Menu className="pt-0">
          <Dropdown.Header className="bg-light fw-bold rounded-top">
            Account
          </Dropdown.Header>
          <Link href="/profile" passHref legacyBehavior>
            <Dropdown.Item>
              <ProfileDropdownItem icon={faUser}>Profile</ProfileDropdownItem>
            </Dropdown.Item>
          </Link>
          <Link href="/" passHref legacyBehavior>
            <Dropdown.Item onClick={() => logout()}>
              <ProfileDropdownItem icon={faPowerOff}>
                Sign Out
              </ProfileDropdownItem>
            </Dropdown.Item>
          </Link>
        </Dropdown.Menu>
      </Dropdown>
    </Nav>
  )
}
