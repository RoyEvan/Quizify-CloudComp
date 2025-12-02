// IMPORT COMPONENT
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownTrigger,
  Avatar,
  Link,
  Button,
  Skeleton,
} from "@heroui/react";
import { LogOut, User } from "lucide-react";
// import { signOut, signIn, useSession } from "next-auth/react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const QuizifyNavbar = (props) => {
  const { data: session, status } = useSession();

  const renderNav = () => {
    if (status !== "authenticated" || !session.user) {
      return (
        <>
          <NavbarItem isActive>
            <Link href="/about" aria-current="page">
              About
            </Link>
          </NavbarItem>
        </>
      );
    }

    if (session.user.type === "student") {
      return (
        <>
          <NavbarItem isActive>
            <Link href="/student" aria-current="page">
              Beranda
            </Link>
          </NavbarItem>
        </>
      );
    }

    if (session.user.type === "teacher") {
      return (
        <>
          <NavbarItem isActive>
            <Link href="/teacher" aria-current="page">
              Beranda
            </Link>
          </NavbarItem>
        </>
      );
    }
  };

  const renderButtonAuth = () => {
    if (status === "authenticated" && session.user) {
      return (
        <Dropdown
          className="bg-black rounded-xl border-neutral-700 border-1"
          placement="bottom-end"
        >
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="secondary"
              name={session.user.name || ""}
              size="sm"
              src={session.user.image || ""}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="Signin" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-bold text-medium text-blue-400">
                {session.user.name}
              </p>
            </DropdownItem>
            <DropdownItem key="Profile" startContent={<User />}>
              <Link
                className="text-white text-small"
                href={
                  session.user.type === "teacher"
                    ? "/teacher/profile"
                    : "/student/profile"
                }
                aria-current="page"
              >
                Profil
              </Link>
            </DropdownItem>
            <DropdownItem
              startContent={<LogOut />}
              className="text-small"
              onClick={() => signOut()}
              key="logout"
              color="danger"
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );
    } else if (status === "loading") {
      return <Skeleton className="flex rounded-full w-8 h-8" />;
    } else {
      return (
        <>
          <NavbarItem>
            <Button
              className="rounded-md"
              key="a"
              onClick={props.handleStudent}
              color="primary"
            >
              Peserta
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button
              className="rounded-md"
              key="b"
              onClick={props.handleTeacher}
              color="primary"
            >
              Guru
            </Button>
          </NavbarItem>
        </>
      );
    }
  };

  return (
    <Navbar className="border-b-1 border-neutral-700">
      <NavbarBrand className="gap-4">
        <Image src={"/logo.svg"} alt="" width="32" height="32" />
        <p className="font-bold text-inherit">QUIZIFY</p>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {renderNav()}
      </NavbarContent>
      <NavbarContent justify="end">{renderButtonAuth()}</NavbarContent>
    </Navbar>
  );
};

export default QuizifyNavbar;
